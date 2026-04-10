from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.reviews"
    label = "reviews"

    def ready(self):
        # Wire up signal handlers that recompute Product.average_rating
        # whenever a review is saved, hidden, or deleted.
        from apps.reviews import signals  # noqa: F401
