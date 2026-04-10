from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class PendingCheckout(BaseModel):
    """
    Temporary storage for cart data + shipping address while a Stripe
    checkout session is in progress. Created before Stripe session,
    looked up in the webhook by UUID stored in Stripe metadata.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    email = models.EmailField()
    items_data = models.JSONField()
    shipping_data = models.JSONField()
    subtotal = models.PositiveIntegerField()
    shipping_cost = models.PositiveIntegerField()
    total = models.PositiveIntegerField()
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        pass


class Order(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    order_number = models.CharField(max_length=12, unique=True, db_index=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    email = models.EmailField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    # Shipping address — embedded snapshot at order time
    shipping_full_name = models.CharField(max_length=255)
    shipping_address_line_1 = models.CharField(max_length=255)
    shipping_address_line_2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_county = models.CharField(max_length=100, blank=True)
    shipping_postcode = models.CharField(max_length=10)
    shipping_country = models.CharField(max_length=2, default="GB")
    shipping_phone = models.CharField(max_length=20, blank=True)

    # Totals in pence
    subtotal = models.PositiveIntegerField()
    shipping_cost = models.PositiveIntegerField()
    total = models.PositiveIntegerField()

    # Stripe
    stripe_checkout_session_id = models.CharField(
        max_length=255, unique=True, db_index=True,
    )
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return self.order_number

    @staticmethod
    def generate_order_number():
        last = (
            Order.objects
            .order_by("-created_at")
            .values_list("order_number", flat=True)
            .first()
        )
        if last:
            seq = int(last.split("-")[1]) + 1
        else:
            seq = 1
        return f"TPH-{seq:06d}"


class OrderItem(BaseModel):
    class FulfillmentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items",
    )
    product = models.ForeignKey(
        "products.Product", on_delete=models.SET_NULL, null=True,
    )
    variant = models.ForeignKey(
        "products.ProductVariant", on_delete=models.SET_NULL, null=True,
    )

    # Snapshots at order time
    product_name = models.CharField(max_length=300)
    variant_sku = models.CharField(max_length=100)
    variant_option_label = models.CharField(max_length=300, blank=True)
    unit_price = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField()
    line_total = models.PositiveIntegerField()
    image_url = models.URLField(max_length=500, blank=True)

    # Per-item fulfillment for mixed self/dropship orders
    fulfillment_type = models.CharField(max_length=10, default="self")
    fulfillment_status = models.CharField(
        max_length=20,
        choices=FulfillmentStatus.choices,
        default=FulfillmentStatus.PENDING,
    )

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"
