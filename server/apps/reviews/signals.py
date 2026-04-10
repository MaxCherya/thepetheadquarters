"""
Keep `Product.average_rating` and `Product.review_count` in sync with the
visible reviews. Only `is_visible=True` reviews count toward the public
aggregate, so hiding a review immediately updates the product page.
"""

from decimal import Decimal

from django.db.models import Avg, Count
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.products.models import Product

from .models import Review, ReviewHelpfulVote


def _recompute_product_rating(product_id) -> None:
    visible = Review.objects.filter(product_id=product_id, is_visible=True)
    agg = visible.aggregate(avg=Avg("rating"), count=Count("id"))
    avg = agg["avg"] or Decimal("0")
    count = agg["count"] or 0
    Product.objects.filter(id=product_id).update(
        average_rating=Decimal(str(round(float(avg), 2))),
        review_count=count,
    )


@receiver(post_save, sender=Review)
def review_saved(sender, instance, **kwargs):
    _recompute_product_rating(instance.product_id)


@receiver(post_delete, sender=Review)
def review_deleted(sender, instance, **kwargs):
    _recompute_product_rating(instance.product_id)


def _recompute_helpful_count(review_id) -> None:
    # Defensive: if the review row was cascade-deleted, the filter just no-ops.
    count = ReviewHelpfulVote.objects.filter(review_id=review_id).count()
    Review.objects.filter(id=review_id).update(helpful_count=count)


@receiver(post_save, sender=ReviewHelpfulVote)
def helpful_vote_added(sender, instance, created, **kwargs):
    if created:
        _recompute_helpful_count(instance.review_id)


@receiver(post_delete, sender=ReviewHelpfulVote)
def helpful_vote_removed(sender, instance, **kwargs):
    _recompute_helpful_count(instance.review_id)
