"""
Analytics ingest pipeline.

The single public entry point is `ingest_batch` — it takes a parsed payload
from the tracking endpoint, looks up or creates the visitor + session, and
bulk-inserts the page views and events. Designed to be cheap: 4 to 6 DB
operations per request regardless of how many events are in the batch.

Bot detection runs BEFORE any DB query so a 100% bot request is rejected
in microseconds.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlparse

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from .models import Event, PageView, Session, Visitor


# ---------------------------------------------------------------------------
# Whitelisted event names — anything else is silently ignored. This stops
# spammers from flooding the table with `name="<script>"` style payloads.
# ---------------------------------------------------------------------------
TRACKED_EVENT_NAMES = frozenset({
    "pageview",
    "product_view",
    "category_view",
    "search",
    "add_to_cart",
    "remove_from_cart",
    "checkout_start",
    "checkout_complete",
    "signup",
    "login",
    "promo_applied",
    "newsletter_subscribed",
})


# ---------------------------------------------------------------------------
# Bot detection — fast string matching, no regex backtracking
# ---------------------------------------------------------------------------
_BOT_TOKENS = (
    "bot", "crawl", "spider", "slurp", "fetch", "scrape", "scraper",
    "headless", "phantom", "selenium", "puppeteer", "playwright",
    "lighthouse", "pagespeed", "monitoring", "uptimerobot",
    "googlebot", "bingbot", "yandexbot", "baiduspider",
    "facebookexternalhit", "twitterbot", "linkedinbot", "whatsapp",
    "curl", "wget", "axios", "okhttp", "go-http-client",
    "python-requests", "python-urllib", "java/", "ruby", "perl",
    "feedfetcher", "feedburner", "ahrefsbot", "semrushbot", "mj12bot",
    "dotbot", "petalbot", "applebot",
)


def is_bot(user_agent: str) -> bool:
    """
    Heuristic bot detector. False positives are acceptable here — a few
    real users on obscure browsers will be missed, but the alternative
    (running our analytics on Googlebot's traffic) skews every report.
    """
    if not user_agent:
        return True
    ua = user_agent.lower()
    if any(token in ua for token in _BOT_TOKENS):
        return True
    # Reject anything that doesn't look like a real browser at all.
    if "mozilla/" not in ua:
        return True
    return False


# ---------------------------------------------------------------------------
# Daily-rotating visitor hash (Plausible-style)
# ---------------------------------------------------------------------------
def daily_visitor_hash(*, ip: str, user_agent: str) -> str:
    """
    Build a SHA-256 hash that's stable for a single calendar day per
    (rough IP, user-agent family). The hash includes a server-side salt
    that nobody outside the deployment can know, so the value can't be
    correlated with anything off-site.

    We use only the first two octets of an IPv4 address (or the /32
    prefix of an IPv6) so we don't store data that could re-identify a
    specific household.
    """
    salt = getattr(settings, "ANALYTICS_DAILY_SALT", "tph-analytics-salt")
    today = timezone.localdate().isoformat()
    rough_ip = _coarsen_ip(ip)
    payload = f"{salt}|{today}|{rough_ip}|{user_agent or '-'}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _coarsen_ip(ip: str) -> str:
    if not ip:
        return "-"
    if ":" in ip:  # IPv6
        return ip.split(":")[0]
    parts = ip.split(".")
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}"
    return "-"


# ---------------------------------------------------------------------------
# User-agent + device parsing — minimal, no third-party deps
# ---------------------------------------------------------------------------
_DEVICE_MOBILE_TOKENS = ("mobile", "android", "iphone", "ipod", "windows phone")
_DEVICE_TABLET_TOKENS = ("ipad", "tablet", "playbook", "kindle", "silk")
_BROWSER_PATTERNS = [
    ("Edge", re.compile(r"edg/|edge/", re.I)),
    ("Chrome", re.compile(r"chrome/", re.I)),
    ("Firefox", re.compile(r"firefox/", re.I)),
    ("Safari", re.compile(r"safari/", re.I)),
    ("Opera", re.compile(r"opr/|opera/", re.I)),
]
_OS_PATTERNS = [
    ("iOS", re.compile(r"iphone|ipad|ipod", re.I)),
    ("Android", re.compile(r"android", re.I)),
    ("macOS", re.compile(r"mac os x|macintosh", re.I)),
    ("Windows", re.compile(r"windows", re.I)),
    ("Linux", re.compile(r"linux", re.I)),
]


def parse_user_agent(user_agent: str) -> tuple[str, str, str]:
    """Returns (device_type, browser, os) — all best-effort, never raises."""
    if not user_agent:
        return (Visitor.DEVICE_OTHER, "", "")

    ua = user_agent.lower()

    if any(t in ua for t in _DEVICE_TABLET_TOKENS):
        device = Visitor.DEVICE_TABLET
    elif any(t in ua for t in _DEVICE_MOBILE_TOKENS):
        device = Visitor.DEVICE_MOBILE
    else:
        device = Visitor.DEVICE_DESKTOP

    browser = ""
    for name, pattern in _BROWSER_PATTERNS:
        if pattern.search(user_agent):
            browser = name
            break

    os_name = ""
    for name, pattern in _OS_PATTERNS:
        if pattern.search(user_agent):
            os_name = name
            break

    return (device, browser, os_name)


def client_ip(request) -> str:
    """
    Best-effort client IP. Trusts the first hop in X-Forwarded-For when
    present (for deployments behind Cloudflare / a load balancer) and
    falls back to REMOTE_ADDR.
    """
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def client_country(request) -> str:
    """
    Country derived from the request. Production deployments behind
    Cloudflare get the ISO code for free via the CF-IPCountry header;
    otherwise we fall back to a 2-letter parse of Accept-Language.
    """
    cf = (request.META.get("HTTP_CF_IPCOUNTRY") or "").strip().upper()
    if cf and len(cf) == 2 and cf.isalpha():
        return cf
    al = (request.META.get("HTTP_ACCEPT_LANGUAGE") or "").strip()
    if "-" in al:
        country = al.split(",")[0].split("-")[-1].strip().upper()
        if len(country) == 2 and country.isalpha():
            return country
    return ""


# ---------------------------------------------------------------------------
# Ingest payload + main entry point
# ---------------------------------------------------------------------------
@dataclass
class IngestEventPayload:
    name: str
    properties: dict = field(default_factory=dict)
    path: str = ""
    title: str = ""


@dataclass
class IngestBatch:
    events: list[IngestEventPayload]
    referrer: str = ""
    utm: dict = field(default_factory=dict)
    user_agent: str = ""
    ip: str = ""
    country: str = ""
    # Django User instance or None — typed as Optional[object] so the
    # dataclass decorator picks it up as a real init parameter (a bare
    # `user = None` would be treated as a class attribute and dropped).
    user: Optional[object] = None


def _session_window_minutes() -> int:
    return getattr(settings, "ANALYTICS_SESSION_TIMEOUT_MINUTES", 30)


def _get_or_create_visitor(*, batch: IngestBatch, now: datetime) -> Visitor:
    daily_hash = daily_visitor_hash(ip=batch.ip, user_agent=batch.user_agent)
    device, browser, os_name = parse_user_agent(batch.user_agent)
    user_obj = batch.user if (batch.user and getattr(batch.user, "is_authenticated", False)) else None

    visitor, created = Visitor.objects.get_or_create(
        daily_hash=daily_hash,
        user=user_obj,
        defaults={
            "first_seen_at": now,
            "last_seen_at": now,
            "country": batch.country,
            "device_type": device,
            "browser": browser,
            "os": os_name,
        },
    )
    if not created:
        # Cheap touch — only update last_seen_at, leave the cached counters
        # to be incremented atomically below.
        Visitor.objects.filter(id=visitor.id).update(last_seen_at=now)
        visitor.last_seen_at = now
    return visitor


def _get_or_open_session(*, visitor: Visitor, batch: IngestBatch, now: datetime) -> Session:
    timeout = timedelta(minutes=_session_window_minutes())

    latest = visitor.sessions.order_by("-last_activity_at").first()
    if latest and (now - latest.last_activity_at) <= timeout:
        # Continue existing session
        Session.objects.filter(id=latest.id).update(last_activity_at=now)
        latest.last_activity_at = now
        return latest

    # Open a new session
    referrer_host = ""
    if batch.referrer:
        try:
            referrer_host = urlparse(batch.referrer).hostname or ""
        except ValueError:
            referrer_host = ""

    entry_path = batch.events[0].path if batch.events else ""

    session = Session.objects.create(
        visitor=visitor,
        started_at=now,
        last_activity_at=now,
        entry_path=entry_path,
        referrer=batch.referrer[:500],
        referrer_host=referrer_host[:200],
        utm_source=(batch.utm.get("source") or "")[:100],
        utm_medium=(batch.utm.get("medium") or "")[:100],
        utm_campaign=(batch.utm.get("campaign") or "")[:100],
        utm_content=(batch.utm.get("content") or "")[:100],
    )
    Visitor.objects.filter(id=visitor.id).update(session_count=F("session_count") + 1)
    return session


@transaction.atomic
def ingest_batch(batch: IngestBatch) -> tuple[int, int]:
    """
    Persist a batch of analytics events. Returns (pageviews_written, events_written).

    Bot filtering happens at the view layer (so we can return 204 fast),
    not here. By the time `ingest_batch` is called the request has already
    been validated as plausibly human.
    """
    if not batch.events:
        return (0, 0)

    now = timezone.now()
    visitor = _get_or_create_visitor(batch=batch, now=now)
    session = _get_or_open_session(visitor=visitor, batch=batch, now=now)

    pageview_rows: list[PageView] = []
    event_rows: list[Event] = []
    last_path = session.exit_path

    for ev in batch.events:
        if ev.name not in TRACKED_EVENT_NAMES:
            continue

        if ev.name == "pageview":
            path = (ev.path or "/")[:500]
            pageview_rows.append(PageView(
                visitor=visitor,
                session=session,
                path=path,
                title=(ev.title or "")[:300],
                viewed_at=now,
            ))
            last_path = path
        else:
            event_rows.append(Event(
                visitor=visitor,
                session=session,
                name=ev.name,
                properties=_safe_properties(ev.properties),
                occurred_at=now,
            ))

    if pageview_rows:
        PageView.objects.bulk_create(pageview_rows)
    if event_rows:
        Event.objects.bulk_create(event_rows)

    pv_count = len(pageview_rows)
    ev_count = len(event_rows)

    # Atomic counter bumps in one query each
    if pv_count:
        Visitor.objects.filter(id=visitor.id).update(
            pageview_count=F("pageview_count") + pv_count,
        )
        Session.objects.filter(id=session.id).update(
            pageview_count=F("pageview_count") + pv_count,
            exit_path=last_path[:500],
        )
    if ev_count:
        Session.objects.filter(id=session.id).update(
            event_count=F("event_count") + ev_count,
        )

    return (pv_count, ev_count)


def _safe_properties(value) -> dict:
    """Sanitize event properties — must be a small JSON-serializable dict."""
    if not isinstance(value, dict):
        return {}
    # Cap key/value sizes so a malicious payload can't blow up the JSON column
    safe: dict = {}
    for k, v in list(value.items())[:20]:  # max 20 keys
        key = str(k)[:60]
        if isinstance(v, (str, int, float, bool)) or v is None:
            safe[key] = v if not isinstance(v, str) else v[:200]
    return safe
