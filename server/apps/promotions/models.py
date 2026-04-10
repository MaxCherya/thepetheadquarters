from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class Promotion(BaseModel):
    """
    A configurable discount code (e.g. WELCOME10).

    A promotion describes WHAT the discount does and WHO/WHEN it can be used.
    Each successful application of a promotion to an order is recorded in
    PromotionRedemption — that's where attribution and "how many people used
    this code" lives.
    """

    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percentage"
        FREE_SHIPPING = "free_shipping", "Free shipping"

    class Scope(models.TextChoices):
        ALL = "all", "Whole cart"
        CATEGORY = "category", "Specific categories"
        BRAND = "brand", "Specific brands"
        PRODUCT = "product", "Specific products"

    class Source(models.TextChoices):
        NEWSLETTER = "newsletter", "Newsletter signup"
        INFLUENCER = "influencer", "Influencer / partner"
        MANUAL = "manual", "Manual / one-off"
        CAMPAIGN = "campaign", "Marketing campaign"
        REFERRAL = "referral", "Customer referral"

    # Identification
    code = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="The code customers type at checkout (case-insensitive on lookup).",
    )
    name = models.CharField(
        max_length=200,
        help_text="Internal label for the admin (e.g. 'First-order welcome 10%').",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Internal notes — never shown to customers.",
    )

    # What the discount does
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.PERCENT,
    )
    discount_value = models.PositiveIntegerField(
        default=0,
        help_text=(
            "For 'percent': 1-100. "
            "For 'free_shipping': ignored."
        ),
    )

    # Scope (what items the discount applies to)
    scope = models.CharField(
        max_length=20,
        choices=Scope.choices,
        default=Scope.ALL,
    )
    scope_categories = models.ManyToManyField(
        "categories.Category",
        blank=True,
        related_name="promotions",
    )
    scope_brands = models.ManyToManyField(
        "brands.Brand",
        blank=True,
        related_name="promotions",
    )
    scope_products = models.ManyToManyField(
        "products.Product",
        blank=True,
        related_name="promotions",
    )

    # Eligibility
    min_subtotal = models.PositiveIntegerField(
        default=0,
        help_text="Minimum cart subtotal (in pence) required to apply this code.",
    )
    is_first_order_only = models.BooleanField(
        default=False,
        help_text="If True, customer must have zero prior non-cancelled orders.",
    )
    is_one_per_customer = models.BooleanField(
        default=False,
        help_text="If True, each user/email may only redeem this code once.",
    )

    # Lifecycle
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    max_uses_total = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optional global cap on total redemptions.",
    )
    max_uses_per_user = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optional cap per individual user/email.",
    )
    times_used = models.PositiveIntegerField(
        default=0,
        help_text="Cached counter — incremented atomically on redemption.",
    )
    click_count = models.PositiveIntegerField(
        default=0,
        help_text=(
            "Cached counter — incremented when the apply URL "
            "(?promo=CODE) is opened in a browser."
        ),
    )
    is_active = models.BooleanField(default=True, db_index=True)

    # Attribution
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.MANUAL,
        db_index=True,
    )
    campaign_label = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="Free-form label for grouping (e.g. 'instagram_oct_2026').",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_created",
    )

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=["source", "is_active"]),
            models.Index(fields=["starts_at", "ends_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} ({self.get_discount_type_display()})"

    @property
    def is_exhausted(self) -> bool:
        if self.max_uses_total is None:
            return False
        return self.times_used >= self.max_uses_total


class PromotionRedemption(BaseModel):
    """
    One row per successful application of a Promotion to an Order.

    This is the canonical source of truth for analytics like
    "how many orders used WELCOME10 and what was the revenue?".
    """

    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.PROTECT,  # never lose redemption history
        related_name="redemptions",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="promotion_redemptions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotion_redemptions",
    )
    guest_email = models.EmailField(
        blank=True,
        default="",
        help_text="Snapshot of the email used (for guest checkouts).",
    )

    discount_amount = models.PositiveIntegerField(
        help_text="Actual discount amount applied to the order, in pence.",
    )
    subtotal_at_use = models.PositiveIntegerField(
        help_text="Cart subtotal at the moment of redemption, in pence.",
    )

    class Meta(BaseModel.Meta):
        constraints = [
            # An order can only ever consume a given promotion once
            # (idempotency for webhook retries).
            models.UniqueConstraint(
                fields=["promotion", "order"],
                name="uniq_promotion_per_order",
            ),
        ]
        indexes = [
            models.Index(fields=["promotion", "created_at"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        return f"{self.promotion.code} on {self.order_id}"
