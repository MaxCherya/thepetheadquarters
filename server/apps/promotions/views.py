"""
Public promotions API.

Currently exposes a single endpoint:

    POST /api/v1/promotions/validate/

which lets the cart/checkout UI check whether a code is valid for the
current cart and return the discount amount it would apply. This endpoint
is intentionally side-effect-free; the actual redemption only happens
inside `apps.orders.services.fulfill_order` after Stripe confirms payment.
"""

from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.core.responses import (
    error_response,
    success_response,
    validation_error_response,
)
from apps.orders.services import CartValidationError, calculate_shipping, validate_cart
from apps.promotions.services import (
    PromotionError,
    build_cart_lines_from_validated_items,
    validate_code,
)


class _ValidateItemSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class ValidatePromoCodeSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=64)
    items = _ValidateItemSerializer(many=True)
    email = serializers.EmailField(required=False, allow_blank=True)


class PromoValidateThrottle(AnonRateThrottle):
    rate = "30/minute"


class ValidatePromoCodeView(APIView):
    """
    Validate a promo code against the current cart and return the discount it
    would apply. Read-only — does not consume the code.
    """

    permission_classes = [AllowAny]
    throttle_classes = [PromoValidateThrottle]

    def post(self, request):
        serializer = ValidatePromoCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        data = serializer.validated_data

        try:
            validated_items = validate_cart(data["items"])
        except CartValidationError as e:
            return error_response(e.code, status_code=400)

        cart_lines = build_cart_lines_from_validated_items(validated_items)
        cart_subtotal = sum(item["line_total"] for item in validated_items)
        shipping_cost = calculate_shipping(cart_subtotal)

        try:
            result = validate_code(
                code=data["code"],
                cart_lines=cart_lines,
                cart_subtotal=cart_subtotal,
                shipping_cost=shipping_cost,
                user=request.user if request.user and request.user.is_authenticated else None,
                email=data.get("email") or (
                    request.user.email if request.user and request.user.is_authenticated else None
                ),
            )
        except PromotionError as e:
            return error_response(e.code, status_code=400)

        return success_response(data={
            "code": result.promotion.code,
            "name": result.promotion.name,
            "discount_type": result.promotion.discount_type,
            "discount_value": result.promotion.discount_value,
            "discount_amount": result.discount_amount,
            "applies_to_shipping": result.applies_to_shipping,
        })
