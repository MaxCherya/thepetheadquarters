"""
Analytics models — first-party, cookieless, GDPR-friendly.

The visitor identity is a daily-rotating SHA-256 hash that combines a
server-side salt, the calendar date, the first two octets of the IP, and
the user-agent family. Same person on the same day → same hash; tomorrow
they look like a brand-new visitor. We never store the raw IP, so under
PECR/UK GDPR this counts as anonymized first-party analytics and does
not require a cookie consent banner.

Authenticated users get the same hash but we also store their `user_id`
on every row, so for logged-in customers we get true cross-day attribution
via their account.
"""

from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class Visitor(BaseModel):
    """
    One row per (daily hash, user) combination. Acts as the de-duplication
    key for everything else — sessions, page views, and events all link
    here so the individual-inspector page can pull a complete history.
    """

    DEVICE_DESKTOP = "desktop"
    DEVICE_MOBILE = "mobile"
    DEVICE_TABLET = "tablet"
    DEVICE_BOT = "bot"
    DEVICE_OTHER = "other"
    DEVICE_CHOICES = [
        (DEVICE_DESKTOP, "Desktop"),
        (DEVICE_MOBILE, "Mobile"),
        (DEVICE_TABLET, "Tablet"),
        (DEVICE_BOT, "Bot"),
        (DEVICE_OTHER, "Other"),
    ]

    daily_hash = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="visitor_records",
    )

    first_seen_at = models.DateTimeField(db_index=True)
    last_seen_at = models.DateTimeField(db_index=True)

    country = models.CharField(max_length=2, blank=True, default="")
    device_type = models.CharField(
        max_length=20, choices=DEVICE_CHOICES, default=DEVICE_OTHER
    )
    browser = models.CharField(max_length=40, blank=True, default="")
    os = models.CharField(max_length=40, blank=True, default="")

    pageview_count = models.PositiveIntegerField(default=0)
    session_count = models.PositiveIntegerField(default=0)

    class Meta(BaseModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["daily_hash", "user"],
                name="uniq_visitor_per_day_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["last_seen_at"]),
            models.Index(fields=["country"]),
            models.Index(fields=["device_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.daily_hash[:12]}{' (' + self.user.email + ')' if self.user_id else ''}"


class Session(BaseModel):
    """
    A continuous activity window from a single visitor. Sessions auto-close
    after `SESSION_TIMEOUT_MINUTES` of inactivity (configurable in settings).
    Used to compute pages-per-session, bounce rate, and session duration.
    """

    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    started_at = models.DateTimeField(db_index=True)
    last_activity_at = models.DateTimeField(db_index=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    entry_path = models.CharField(max_length=500, blank=True, default="")
    exit_path = models.CharField(max_length=500, blank=True, default="")

    referrer = models.URLField(max_length=500, blank=True, default="")
    referrer_host = models.CharField(max_length=200, blank=True, default="", db_index=True)

    utm_source = models.CharField(max_length=100, blank=True, default="", db_index=True)
    utm_medium = models.CharField(max_length=100, blank=True, default="")
    utm_campaign = models.CharField(max_length=100, blank=True, default="")
    utm_content = models.CharField(max_length=100, blank=True, default="")

    pageview_count = models.PositiveIntegerField(default=0)
    event_count = models.PositiveIntegerField(default=0)

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=["visitor", "-started_at"]),
            models.Index(fields=["utm_source"]),
        ]


class PageView(BaseModel):
    """
    A single page navigation. Stored denormalized with `visitor` so the
    individual inspector and the top-pages report can both query without
    joining through Session.
    """

    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.CASCADE,
        related_name="pageviews",
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="pageviews",
    )

    path = models.CharField(max_length=500, db_index=True)
    title = models.CharField(max_length=300, blank=True, default="")
    viewed_at = models.DateTimeField(db_index=True)

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=["path", "viewed_at"]),
            models.Index(fields=["visitor", "-viewed_at"]),
        ]


class Event(BaseModel):
    """
    A custom event fired by the frontend tracker. The `name` is a free-form
    string but should be one of a small whitelist (see TRACKED_EVENT_NAMES
    in services). Properties are stored as JSON for flexibility — no schema
    migration needed when we add a new event type.
    """

    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.CASCADE,
        related_name="events",
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="events",
    )

    name = models.CharField(max_length=80, db_index=True)
    properties = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(db_index=True)

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=["name", "occurred_at"]),
            models.Index(fields=["visitor", "-occurred_at"]),
        ]


class DailyAggregate(BaseModel):
    """
    Pre-aggregated counters for fast historical reporting and to keep
    the raw tables small. Populated by the `prune_analytics` management
    command and queried by the admin overview report for any date older
    than `ANALYTICS_RAW_RETENTION_DAYS`.
    """

    date = models.DateField(unique=True, db_index=True)
    visitors = models.PositiveIntegerField(default=0)
    sessions = models.PositiveIntegerField(default=0)
    pageviews = models.PositiveIntegerField(default=0)
    events = models.PositiveIntegerField(default=0)
    purchases = models.PositiveIntegerField(default=0)
    revenue_pence = models.PositiveIntegerField(default=0)

    class Meta(BaseModel.Meta):
        ordering = ["-date"]
