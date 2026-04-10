import json
import logging

import stripe
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F
from django.template.loader import render_to_string
from django.utils import timezone

from apps.products.models import Product, ProductVariant

logger = logging.getLogger(__name__)

_is_console_backend = (
    getattr(settings, "EMAIL_BACKEND", "")
    == "django.core.mail.backends.console.EmailBackend"
)


class CartValidationError(Exception):
    def __init__(self, code, details=None):
        self.code = code
        self.details = details or {}
        super().__init__(code)


def validate_cart(items):
    """
    Validate cart items against the database.
    Returns list of dicts with variant objects and DB prices.
    Raises CartValidationError on any issue.
    """
    if not items:
        raise CartValidationError("checkout.cart_empty")

    variant_ids = [item["variant_id"] for item in items]
    quantity_map = {str(item["variant_id"]): item["quantity"] for item in items}

    variants = (
        ProductVariant.objects
        .filter(id__in=variant_ids, is_active=True)
        .select_related("product")
        .prefetch_related(
            "product__translations",
            "product__images",
            "option_values__translations",
        )
    )

    variant_map = {str(v.id): v for v in variants}

    validated = []
    errors = []

    for item in items:
        vid = str(item["variant_id"])
        quantity = item["quantity"]
        variant = variant_map.get(vid)

        if not variant:
            errors.append({"variant_id": vid, "code": "checkout.variant_not_found"})
            continue

        if not variant.product.is_active:
            errors.append({"variant_id": vid, "code": "checkout.product_unavailable"})
            continue

        if variant.stock_quantity < quantity:
            errors.append({
                "variant_id": vid,
                "code": "checkout.insufficient_stock",
                "available": variant.stock_quantity,
            })
            continue

        # Get product name and image from translations
        translation = variant.product.translations.filter(language="en").first()
        product_name = translation.name if translation else str(variant.product.pk)

        primary_image = variant.product.images.filter(is_primary=True).first()
        image_url = primary_image.url if primary_image else ""

        # Build option label from variant option values
        option_parts = []
        for ov in variant.option_values.all():
            ov_trans = ov.translations.filter(language="en").first()
            if ov_trans:
                option_parts.append(ov_trans.value)
        option_label = " / ".join(option_parts)

        validated.append({
            "variant": variant,
            "product": variant.product,
            "product_name": product_name,
            "image_url": image_url,
            "option_label": option_label,
            "quantity": quantity,
            "unit_price": variant.price,
            "line_total": variant.price * quantity,
        })

    if errors:
        raise CartValidationError("checkout.validation_failed", details=errors)

    return validated


def calculate_shipping(subtotal_pence):
    """Calculate shipping cost based on subtotal."""
    threshold = getattr(settings, "SHIPPING_FREE_THRESHOLD_PENCE", 3000)
    flat_rate = getattr(settings, "SHIPPING_FLAT_RATE_PENCE", 399)

    if subtotal_pence >= threshold:
        return 0
    return flat_rate


def create_stripe_checkout_session(validated_items, shipping_address, email, user, request):
    """
    Create a Stripe Checkout session from validated cart data.
    Cart data is stored in a PendingCheckout row; only its UUID is
    passed via Stripe metadata (Stripe limits metadata values to 500 chars).
    Returns the session URL for redirect.
    """
    from apps.orders.models import PendingCheckout

    stripe.api_key = settings.STRIPE_SECRET_KEY

    subtotal = sum(item["line_total"] for item in validated_items)
    shipping_cost = calculate_shipping(subtotal)
    total = subtotal + shipping_cost

    # Build Stripe line items
    line_items = []
    for item in validated_items:
        line_item = {
            "price_data": {
                "currency": "gbp",
                "unit_amount": item["unit_price"],
                "product_data": {
                    "name": item["product_name"],
                },
            },
            "quantity": item["quantity"],
        }
        if item["image_url"]:
            line_item["price_data"]["product_data"]["images"] = [item["image_url"]]
        if item["option_label"]:
            line_item["price_data"]["product_data"]["description"] = item["option_label"]
        line_items.append(line_item)

    # Add shipping as a line item if applicable
    if shipping_cost > 0:
        line_items.append({
            "price_data": {
                "currency": "gbp",
                "unit_amount": shipping_cost,
                "product_data": {"name": "Standard Delivery"},
            },
            "quantity": 1,
        })

    # Snapshot items + shipping into a PendingCheckout row
    items_data = [
        {
            "variant_id": str(item["variant"].id),
            "product_id": str(item["product"].id),
            "product_name": item["product_name"],
            "variant_sku": item["variant"].sku,
            "option_label": item["option_label"],
            "unit_price": item["unit_price"],
            "quantity": item["quantity"],
            "line_total": item["line_total"],
            "image_url": item["image_url"],
            "fulfillment_type": item["product"].fulfillment_type,
        }
        for item in validated_items
    ]

    pending = PendingCheckout.objects.create(
        user=user,
        email=email,
        items_data=items_data,
        shipping_data=shipping_address,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=total,
    )

    session = stripe.checkout.Session.create(
        mode="payment",
        currency="gbp",
        line_items=line_items,
        customer_email=email,
        metadata={"pending_checkout_id": str(pending.id)},
        success_url=f"{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/cart",
    )

    return session.url, session.id


def fulfill_order(session):
    """
    Create the order from a completed Stripe checkout session.
    Idempotent — skips if order already exists for this session.
    """
    from apps.orders.models import Order, OrderItem, PendingCheckout

    session_id = session["id"]

    # Idempotency check
    if Order.objects.filter(stripe_checkout_session_id=session_id).exists():
        logger.info("Order already exists for session %s, skipping.", session_id)
        return

    # Stripe StripeObject — access keys directly via bracket notation
    try:
        pending_id = session["metadata"]["pending_checkout_id"]
    except (KeyError, TypeError):
        pending_id = ""

    if not pending_id:
        logger.error("No pending_checkout_id in session %s metadata", session_id)
        return

    try:
        pending = PendingCheckout.objects.get(id=pending_id)
    except PendingCheckout.DoesNotExist:
        logger.error("PendingCheckout %s not found for session %s", pending_id, session_id)
        return

    items_data = pending.items_data
    shipping_data = pending.shipping_data
    email = pending.email
    user_id = str(pending.user_id) if pending.user_id else ""
    subtotal = pending.subtotal
    shipping_cost = pending.shipping_cost
    total = pending.total

    try:
        payment_intent_id = session["payment_intent"] or ""
    except (KeyError, TypeError):
        payment_intent_id = ""

    with transaction.atomic():
        # Create order
        order = Order.objects.create(
            order_number=Order.generate_order_number(),
            user_id=user_id if user_id else None,
            email=email,
            status=Order.Status.PAID,
            shipping_full_name=shipping_data.get("full_name", ""),
            shipping_address_line_1=shipping_data.get("address_line_1", ""),
            shipping_address_line_2=shipping_data.get("address_line_2", ""),
            shipping_city=shipping_data.get("city", ""),
            shipping_county=shipping_data.get("county", ""),
            shipping_postcode=shipping_data.get("postcode", ""),
            shipping_country=shipping_data.get("country", "GB"),
            shipping_phone=shipping_data.get("phone", ""),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
            stripe_checkout_session_id=session_id,
            stripe_payment_intent_id=payment_intent_id,
            paid_at=timezone.now(),
        )

        # Create order items and decrement stock
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=item_data["product_id"],
                variant_id=item_data["variant_id"],
                product_name=item_data["product_name"],
                variant_sku=item_data["variant_sku"],
                variant_option_label=item_data.get("option_label", ""),
                unit_price=item_data["unit_price"],
                quantity=item_data["quantity"],
                line_total=item_data["line_total"],
                image_url=item_data.get("image_url", ""),
                fulfillment_type=item_data.get("fulfillment_type", "self"),
            )

            # Atomic stock decrement
            updated = (
                ProductVariant.objects
                .filter(id=item_data["variant_id"], stock_quantity__gte=item_data["quantity"])
                .update(stock_quantity=F("stock_quantity") - item_data["quantity"])
            )
            if not updated:
                logger.warning(
                    "Stock insufficient for variant %s during fulfillment (order %s). "
                    "Order created but stock may be oversold.",
                    item_data["variant_sku"],
                    order.order_number,
                )

        # Mark PendingCheckout consumed (within the transaction)
        pending.consumed_at = timezone.now()
        pending.save(update_fields=["consumed_at"])

    logger.info("Order %s created successfully.", order.order_number)
    send_order_confirmation_email(order)

    return order


def send_order_confirmation_email(order):
    """Send order confirmation email."""
    confirmation_url = f"{settings.FRONTEND_URL}/checkout/success?session_id={order.stripe_checkout_session_id}"

    if _is_console_backend:
        logger.info(
            "\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  📧 Order Confirmation — %s\n"
            "  💰 Total: £%.2f\n"
            "  📬 %s\n"
            "  🔗 %s\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            order.order_number,
            order.total / 100,
            order.email,
            confirmation_url,
        )
        return

    context = {
        "order": order,
        "items": order.items.all(),
        "confirmation_url": confirmation_url,
        "site_name": "The Pet Headquarters",
    }

    html_message = render_to_string("orders/emails/confirmation.html", context)
    plain_message = render_to_string("orders/emails/confirmation.txt", context)

    send_mail(
        subject=f"Order confirmed — {order.order_number}",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.email],
        html_message=html_message,
        fail_silently=True,
    )
