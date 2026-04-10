"""
Service layer for admin order actions: ship, cancel, refund, deliver.
Handles state transitions, restocking, Stripe refunds, and email notifications.
"""

import logging

import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.orders.models import Order, OrderItem
from apps.products.models import ProductVariant
from apps.procurement.services import restock_for_refund

logger = logging.getLogger(__name__)


class OrderActionError(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


def _is_console_email():
    return (
        getattr(settings, "EMAIL_BACKEND", "")
        == "django.core.mail.backends.console.EmailBackend"
    )


def _send_shipped_email(order):
    """Console-friendly shipped email — full SMTP template can be added later."""
    if _is_console_email():
        logger.info(
            "\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  📦 Order Shipped — %s\n"
            "  🚚 Carrier: %s\n"
            "  📋 Tracking: %s\n"
            "  🔗 %s\n"
            "  📬 To: %s\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            order.order_number,
            order.get_tracking_carrier_display() if order.tracking_carrier else "N/A",
            order.tracking_number or "(URL only)",
            order.tracking_link or order.tracking_url,
            order.email,
        )
        return
    # SMTP path: render templates and send_mail (deferred for now)


def _send_cancelled_email(order, refunded=False):
    if _is_console_email():
        logger.info(
            "\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  ❌ Order %s — %s\n"
            "  💰 Refund: %s\n"
            "  📬 To: %s\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            order.order_number,
            "Refunded" if refunded else "Cancelled",
            f"£{order.refund_amount / 100:.2f}" if refunded else "N/A",
            order.email,
        )


def _send_delivered_email(order):
    if _is_console_email():
        logger.info(
            "\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  ✅ Order Delivered — %s\n"
            "  📬 To: %s\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            order.order_number,
            order.email,
        )


@transaction.atomic
def transition_status(order, new_status, user=None):
    """Generic status transition (used for non-shipping moves like processing/delivered)."""
    order.status = new_status

    if new_status == Order.Status.DELIVERED and not order.delivered_at:
        order.delivered_at = timezone.now()
        order.save(update_fields=["status", "delivered_at"])
        _send_delivered_email(order)
    elif new_status == Order.Status.CANCELLED and not order.cancelled_at:
        order.cancelled_at = timezone.now()
        order.save(update_fields=["status", "cancelled_at"])
    else:
        order.save(update_fields=["status"])

    return order


@transaction.atomic
def ship_order(order, carrier, tracking_number, tracking_url, user=None):
    """Mark order as shipped, set tracking, send email."""
    if order.status not in (Order.Status.PAID, Order.Status.PROCESSING):
        raise OrderActionError("admin.orders.cannot_ship")

    order.tracking_carrier = carrier
    order.tracking_number = tracking_number
    order.tracking_url = tracking_url
    order.status = Order.Status.SHIPPED
    order.shipped_at = timezone.now()
    order.save(update_fields=[
        "tracking_carrier",
        "tracking_number",
        "tracking_url",
        "status",
        "shipped_at",
    ])

    # Update each item's fulfillment status (only self-fulfilled items here;
    # dropship items follow their own flow)
    order.items.filter(fulfillment_type="self").update(
        fulfillment_status=OrderItem.FulfillmentStatus.SHIPPED,
    )

    _send_shipped_email(order)
    return order


@transaction.atomic
def deliver_order(order, user=None):
    if order.status != Order.Status.SHIPPED:
        raise OrderActionError("admin.orders.cannot_deliver")
    order.status = Order.Status.DELIVERED
    order.delivered_at = timezone.now()
    order.save(update_fields=["status", "delivered_at"])
    order.items.update(fulfillment_status=OrderItem.FulfillmentStatus.DELIVERED)
    _send_delivered_email(order)
    return order


@transaction.atomic
def cancel_order(order, reason="", user=None):
    """Cancel an order. Restocks self-fulfilled items if order was at least paid."""
    if order.status in (Order.Status.CANCELLED, Order.Status.DELIVERED):
        raise OrderActionError("admin.orders.cannot_cancel")

    should_restock = order.status in (
        Order.Status.PAID,
        Order.Status.PROCESSING,
        Order.Status.SHIPPED,
    )

    order.status = Order.Status.CANCELLED
    order.cancelled_at = timezone.now()
    if reason:
        order.internal_notes = (order.internal_notes or "") + f"\n\nCancelled: {reason}"
    order.save(update_fields=["status", "cancelled_at", "internal_notes"])

    if should_restock:
        for item in order.items.filter(fulfillment_type="self"):
            try:
                variant = ProductVariant.objects.get(id=item.variant_id)
            except ProductVariant.DoesNotExist:
                continue
            restock_for_refund(
                variant=variant,
                quantity=item.quantity,
                order_item=item,
                user=user,
            )

    _send_cancelled_email(order, refunded=False)
    return order


@transaction.atomic
def refund_order(order, user=None):
    """Issue a Stripe refund and cancel the order with restock."""
    if order.status not in (Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SHIPPED):
        raise OrderActionError("admin.orders.cannot_refund")

    if not order.stripe_payment_intent_id:
        raise OrderActionError("admin.orders.no_payment_intent")

    if not settings.STRIPE_SECRET_KEY:
        raise OrderActionError("admin.orders.stripe_not_configured")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # Idempotency_key prevents double refund on retry
    stripe.Refund.create(
        payment_intent=order.stripe_payment_intent_id,
        idempotency_key=f"refund_{order.id}",
    )

    order.status = Order.Status.CANCELLED
    order.refunded_at = timezone.now()
    order.cancelled_at = timezone.now()
    order.refund_amount = order.total
    order.save(update_fields=["status", "refunded_at", "cancelled_at", "refund_amount"])

    # Restock self-fulfilled items
    for item in order.items.filter(fulfillment_type="self"):
        try:
            variant = ProductVariant.objects.get(id=item.variant_id)
        except ProductVariant.DoesNotExist:
            continue
        restock_for_refund(
            variant=variant,
            quantity=item.quantity,
            order_item=item,
            user=user,
        )

    _send_cancelled_email(order, refunded=True)
    return order
