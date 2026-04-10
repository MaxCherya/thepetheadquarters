from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel


class Review(BaseModel):
    """
    A customer review for a single product.

    Reviews are tied to an order, which is the ground truth that the
    reviewer is a verified buyer. The pair (product, user) is unique so
    a customer can only have one review per product (they can edit it
    within EDIT_WINDOW_DAYS of creation).
    """

    EDIT_WINDOW_DAYS = 30
    BODY_MIN_LENGTH = 10
    BODY_MAX_LENGTH = 2000

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews",
        help_text="The order that proves verified-buyer status at write time.",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    title = models.CharField(max_length=200, blank=True, default="")
    body = models.TextField()

    is_visible = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Admin can hide a review without deleting it.",
    )
    helpful_count = models.PositiveIntegerField(default=0)

    # Optional public reply from the merchant — single reply per review.
    admin_reply = models.TextField(blank=True, default="")
    admin_reply_at = models.DateTimeField(null=True, blank=True)
    admin_reply_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="review_replies",
    )

    class Meta(BaseModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["product", "user"],
                name="uniq_review_per_product_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["product", "is_visible", "-created_at"]),
            models.Index(fields=["product", "is_visible", "-rating"]),
            models.Index(fields=["product", "is_visible", "-helpful_count"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} → {self.product_id}: {self.rating}★"

    @property
    def is_editable(self) -> bool:
        """True if the author may still edit this review (within edit window)."""
        from django.utils import timezone
        from datetime import timedelta

        return timezone.now() - self.created_at < timedelta(days=self.EDIT_WINDOW_DAYS)


class ReviewHelpfulVote(BaseModel):
    """
    One row per (review, user) pair recording a 'helpful' vote.

    The unique constraint enforces a single vote per user per review,
    so toggling is just a delete-or-create.
    """

    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name="helpful_votes",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="review_helpful_votes",
    )

    class Meta(BaseModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["review", "user"],
                name="uniq_helpful_vote_per_user",
            ),
        ]
