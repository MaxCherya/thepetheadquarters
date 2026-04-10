import logging

import stripe
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Address
from apps.core.responses import (
    error_response,
    success_response,
    validation_error_response,
)
from apps.core.pagination import StandardPagination

from apps.orders.models import Order
from apps.orders.serializers import (
    CreateCheckoutSessionSerializer,
    OrderListSerializer,
    OrderSerializer,
)
from apps.orders.services import (
    CartValidationError,
    calculate_shipping,
    create_stripe_checkout_session,
    fulfill_order,
    validate_cart,
)

logger = logging.getLogger(__name__)


class CreateCheckoutSessionView(APIView):
    def post(self, request):
        # Email verification gate for authenticated users
        if request.user and request.user.is_authenticated:
            if not request.user.is_email_verified:
                return error_response("checkout.email_not_verified", status_code=403)

        serializer = CreateCheckoutSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        data = serializer.validated_data

        # Determine email
        if request.user and request.user.is_authenticated:
            email = request.user.email
        else:
            email = data.get("email")
            if not email:
                return error_response("checkout.email_required")

        # Resolve shipping address
        saved_address_id = data.get("saved_address_id")
        if saved_address_id and request.user and request.user.is_authenticated:
            try:
                addr = Address.objects.get(id=saved_address_id, user=request.user)
                shipping_address = {
                    "full_name": addr.full_name,
                    "address_line_1": addr.address_line_1,
                    "address_line_2": addr.address_line_2,
                    "city": addr.city,
                    "county": addr.county,
                    "postcode": addr.postcode,
                    "country": addr.country,
                    "phone": addr.phone,
                }
            except Address.DoesNotExist:
                return error_response("checkout.address_not_found", status_code=404)
        else:
            shipping_address = data["shipping_address"]

        # Validate cart against DB
        try:
            validated_items = validate_cart(data["items"])
        except CartValidationError as e:
            return error_response(e.code, status_code=400)

        # Create Stripe session
        user = request.user if request.user and request.user.is_authenticated else None

        if not settings.STRIPE_SECRET_KEY:
            return error_response("checkout.stripe_not_configured", status_code=503)

        try:
            checkout_url, session_id = create_stripe_checkout_session(
                validated_items=validated_items,
                shipping_address=shipping_address,
                email=email,
                user=user,
                request=request,
            )
        except stripe.error.StripeError as e:
            logger.error("Stripe error: %s", e)
            return error_response("checkout.payment_error", status_code=502)

        return success_response(data={
            "checkout_url": checkout_url,
            "session_id": session_id,
        })


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        if not settings.STRIPE_WEBHOOK_SECRET:
            logger.warning("Stripe webhook secret not configured.")
            return Response(status=400)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
            )
        except ValueError:
            logger.warning("Invalid webhook payload.")
            return Response(status=400)
        except stripe.error.SignatureVerificationError:
            logger.warning("Invalid webhook signature.")
            return Response(status=400)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            logger.info("Webhook checkout.session.completed for %s", session["id"])
            try:
                result = fulfill_order(session)
                logger.info("fulfill_order returned: %s", result)
            except Exception:
                logger.exception("Error fulfilling order for session %s", session["id"])
        elif event["type"] == "payment_intent.payment_failed":
            intent = event["data"]["object"]
            logger.warning("Payment failed for intent %s", intent["id"])

        return Response(status=200)


class OrderDetailView(APIView):
    def get(self, request, order_number):
        # Authenticated user — must own the order
        if request.user and request.user.is_authenticated:
            try:
                order = Order.objects.prefetch_related("items").get(
                    order_number=order_number,
                    user=request.user,
                )
            except Order.DoesNotExist:
                return error_response("orders.not_found", status_code=404)

        else:
            # Guest lookup — requires session_id for security
            session_id = request.query_params.get("session_id", "")
            if not session_id:
                return error_response("orders.unauthorized", status_code=401)

            try:
                order = Order.objects.prefetch_related("items").get(
                    order_number=order_number,
                    stripe_checkout_session_id=session_id,
                )
            except Order.DoesNotExist:
                return error_response("orders.not_found", status_code=404)

        return success_response(data=OrderSerializer(order).data)


class OrderBySessionView(APIView):
    """
    Look up an order by its Stripe checkout session ID.
    Used by the success page after redirect from Stripe.
    Works for both guests and authenticated users (session IDs are unguessable).
    """

    def get(self, request, session_id):
        try:
            order = Order.objects.prefetch_related("items").get(
                stripe_checkout_session_id=session_id,
            )
        except Order.DoesNotExist:
            return error_response("orders.not_found", status_code=404)

        # If authenticated, verify the order belongs to them (defensive check)
        if request.user and request.user.is_authenticated and order.user_id:
            if order.user_id != request.user.id:
                return error_response("orders.not_found", status_code=404)

        return success_response(data=OrderSerializer(order).data)


class OrderHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Retroactively link guest orders that share the same email
        # to this account (e.g. ordered as guest, then created an account).
        Order.objects.filter(
            user__isnull=True,
            email__iexact=request.user.email,
        ).update(user=request.user)

        orders = (
            Order.objects
            .filter(user=request.user)
            .exclude(status=Order.Status.PENDING)
            .prefetch_related("items")
            .order_by("-created_at")
        )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(orders, request)
        serializer = OrderListSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)
