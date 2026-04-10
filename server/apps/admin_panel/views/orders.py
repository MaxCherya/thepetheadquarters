"""
Admin order management endpoints.
"""

import logging

import stripe
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.response import Response

from apps.core.responses import (
    error_response,
    success_response,
    validation_error_response,
)

from apps.orders.models import Order, OrderItem
from apps.admin_panel.pagination import AdminPagination
from apps.admin_panel.serializers.orders import (
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
)
from apps.admin_panel.views.base import AdminBaseView
from apps.admin_panel.services.orders import (
    OrderActionError,
    cancel_order,
    deliver_order,
    refund_order,
    ship_order,
    transition_status,
)

logger = logging.getLogger(__name__)


VALID_STATUS_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.PAID, Order.Status.CANCELLED},
    Order.Status.PAID: {Order.Status.PROCESSING, Order.Status.CANCELLED},
    Order.Status.PROCESSING: {Order.Status.SHIPPED, Order.Status.CANCELLED},
    Order.Status.SHIPPED: {Order.Status.DELIVERED, Order.Status.CANCELLED},
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
}


class AdminOrderListView(AdminBaseView):
    def get(self, request):
        qs = Order.objects.all().prefetch_related("items").order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search)
                | Q(email__icontains=search)
                | Q(shipping_full_name__icontains=search)
            )

        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        min_total = request.query_params.get("min_total")
        if min_total:
            try:
                qs = qs.filter(total__gte=int(min_total))
            except ValueError:
                pass

        max_total = request.query_params.get("max_total")
        if max_total:
            try:
                qs = qs.filter(total__lte=int(max_total))
            except ValueError:
                pass

        ordering = request.query_params.get("ordering", "-created_at")
        if ordering in ("created_at", "-created_at", "total", "-total"):
            qs = qs.order_by(ordering)

        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdminOrderListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminOrderDetailView(AdminBaseView):
    def get(self, request, order_number):
        try:
            order = Order.objects.prefetch_related("items").get(order_number=order_number)
        except Order.DoesNotExist:
            return error_response("admin.orders.not_found", status_code=404)
        return success_response(data=AdminOrderDetailSerializer(order).data)


class AdminOrderStatusView(AdminBaseView):
    def post(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return error_response("admin.orders.not_found", status_code=404)

        target = request.data.get("status")
        force = request.query_params.get("force") == "true"

        if not target or target not in Order.Status.values:
            return error_response("admin.orders.invalid_status")

        if not force:
            allowed = VALID_STATUS_TRANSITIONS.get(order.status, set())
            if target not in allowed:
                return error_response("admin.orders.invalid_transition")

        try:
            transition_status(order, target, user=request.user)
        except OrderActionError as e:
            return error_response(e.code)

        return success_response(data=AdminOrderDetailSerializer(order).data)


class AdminOrderShipView(AdminBaseView):
    def post(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return error_response("admin.orders.not_found", status_code=404)

        carrier = request.data.get("carrier", "").strip()
        tracking_number = request.data.get("tracking_number", "").strip()
        tracking_url = request.data.get("tracking_url", "").strip()

        if not carrier or carrier not in Order.Carrier.values:
            return error_response("admin.orders.carrier_required")

        if carrier == Order.Carrier.OTHER:
            if not tracking_url:
                return error_response("admin.orders.url_required")
        else:
            if not tracking_number:
                return error_response("admin.orders.tracking_required")

        try:
            ship_order(
                order=order,
                carrier=carrier,
                tracking_number=tracking_number,
                tracking_url=tracking_url,
                user=request.user,
            )
        except OrderActionError as e:
            return error_response(e.code)

        return success_response(data=AdminOrderDetailSerializer(order).data)


class AdminOrderCancelView(AdminBaseView):
    def post(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return error_response("admin.orders.not_found", status_code=404)

        reason = request.data.get("reason", "")

        try:
            cancel_order(order=order, reason=reason, user=request.user)
        except OrderActionError as e:
            return error_response(e.code)

        return success_response(data=AdminOrderDetailSerializer(order).data)


class AdminOrderRefundView(AdminBaseView):
    def post(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return error_response("admin.orders.not_found", status_code=404)

        try:
            refund_order(order=order, user=request.user)
        except OrderActionError as e:
            return error_response(e.code, status_code=400)
        except stripe.error.StripeError as e:
            logger.error("Stripe refund error: %s", e)
            return error_response("admin.orders.refund_failed", status_code=502)

        return success_response(data=AdminOrderDetailSerializer(order).data)


class AdminOrderNotesView(AdminBaseView):
    def patch(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return error_response("admin.orders.not_found", status_code=404)

        notes = request.data.get("internal_notes", "")
        order.internal_notes = notes
        order.save(update_fields=["internal_notes"])
        return success_response(data=AdminOrderDetailSerializer(order).data)


class AdminDropshipPendingView(AdminBaseView):
    def get(self, request):
        items = (
            OrderItem.objects.filter(
                fulfillment_type="dropship",
                fulfillment_status=OrderItem.FulfillmentStatus.PENDING,
                order__status__in=[Order.Status.PAID, Order.Status.PROCESSING],
            )
            .select_related("order")
            .order_by("-order__created_at")
        )

        from apps.admin_panel.serializers.orders import AdminOrderItemSerializer

        return success_response(
            data=[
                {
                    **AdminOrderItemSerializer(item).data,
                    "order_number": item.order.order_number,
                    "order_email": item.order.email,
                    "shipping_full_name": item.order.shipping_full_name,
                    "shipping_address_line_1": item.order.shipping_address_line_1,
                    "shipping_city": item.order.shipping_city,
                    "shipping_postcode": item.order.shipping_postcode,
                }
                for item in items
            ]
        )


class AdminOrderForwardItemView(AdminBaseView):
    """Mark a dropship order item as forwarded to its supplier."""

    def post(self, request, order_number, item_id):
        try:
            order = Order.objects.get(order_number=order_number)
            item = order.items.get(id=item_id)
        except (Order.DoesNotExist, OrderItem.DoesNotExist):
            return error_response("admin.orders.not_found", status_code=404)

        if item.fulfillment_type != "dropship":
            return error_response("admin.orders.not_dropship")

        supplier_id = request.data.get("supplier_id")
        supplier_cost = int(request.data.get("supplier_cost", 0) or 0)

        item.supplier_id = supplier_id if supplier_id else None
        item.supplier_cost = supplier_cost
        item.forwarded_to_supplier_at = timezone.now()
        item.fulfillment_status = OrderItem.FulfillmentStatus.PROCESSING
        item.save(update_fields=[
            "supplier_id",
            "supplier_cost",
            "forwarded_to_supplier_at",
            "fulfillment_status",
        ])

        from apps.admin_panel.serializers.orders import AdminOrderItemSerializer
        return success_response(data=AdminOrderItemSerializer(item).data)
