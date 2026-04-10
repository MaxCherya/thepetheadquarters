"""
Roll up old raw analytics rows into the DailyAggregate table and delete
the originals. Run nightly via cron / Render scheduled job:

    python manage.py prune_analytics

Idempotent: re-running the same day produces the same end state.
"""

from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.analytics.models import DailyAggregate, Event, PageView, Session, Visitor
from apps.orders.models import Order


class Command(BaseCommand):
    help = (
        "Roll up analytics rows older than ANALYTICS_RAW_RETENTION_DAYS into "
        "the daily aggregate table and delete the raw rows."
    )

    def handle(self, *args, **options):
        retention = getattr(settings, "ANALYTICS_RAW_RETENTION_DAYS", 90)
        cutoff_date = timezone.localdate() - timedelta(days=retention)

        self.stdout.write(
            f"Pruning analytics rows older than {cutoff_date} "
            f"(retention = {retention} days)..."
        )

        # 1. Roll each day older than the cutoff into a single aggregate row
        days_with_data = (
            PageView.objects.filter(viewed_at__date__lt=cutoff_date)
            .annotate(day=TruncDate("viewed_at"))
            .values_list("day", flat=True)
            .distinct()
        )

        rolled_up = 0
        for day in days_with_data:
            self._aggregate_day(day)
            rolled_up += 1

        # 2. Hard-delete raw rows older than cutoff
        with transaction.atomic():
            ev_deleted, _ = Event.objects.filter(occurred_at__date__lt=cutoff_date).delete()
            pv_deleted, _ = PageView.objects.filter(viewed_at__date__lt=cutoff_date).delete()
            sess_deleted, _ = Session.objects.filter(started_at__date__lt=cutoff_date).delete()
            # Visitors with no remaining sessions can also go
            v_deleted, _ = Visitor.objects.filter(
                last_seen_at__date__lt=cutoff_date,
                sessions__isnull=True,
            ).delete()

        self.stdout.write(self.style.SUCCESS(
            f"Done. Rolled up {rolled_up} day(s); "
            f"deleted {pv_deleted} pageviews, {ev_deleted} events, "
            f"{sess_deleted} sessions, {v_deleted} visitors."
        ))

    def _aggregate_day(self, day):
        """Build or refresh the DailyAggregate row for one calendar day."""
        visitors = Visitor.objects.filter(first_seen_at__date=day).count()
        sessions = Session.objects.filter(started_at__date=day).count()
        pageviews = PageView.objects.filter(viewed_at__date=day).count()
        events = Event.objects.filter(occurred_at__date=day).count()

        # Pull purchase + revenue figures from the orders table — they live
        # forever (we don't prune orders), so this is always accurate.
        order_qs = Order.objects.filter(
            paid_at__date=day,
        ).exclude(status=Order.Status.CANCELLED)
        purchases = order_qs.count()
        revenue_pence = order_qs.aggregate(t=Sum("total"))["t"] or 0

        DailyAggregate.objects.update_or_create(
            date=day,
            defaults={
                "visitors": visitors,
                "sessions": sessions,
                "pageviews": pageviews,
                "events": events,
                "purchases": purchases,
                "revenue_pence": revenue_pence,
            },
        )
