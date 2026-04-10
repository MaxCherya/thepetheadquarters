"""
Public analytics tracking endpoint.

POST /api/v1/analytics/track/

Accepts a batch of events in a single request to minimise the number of
network round-trips from the browser. Returns 204 No Content on success
or silent failure (we never reveal whether tracking succeeded — that just
gives spammers a feedback loop).
"""

from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .services import (
    IngestBatch,
    IngestEventPayload,
    TRACKED_EVENT_NAMES,
    client_country,
    client_ip,
    ingest_batch,
    is_bot,
)


class _EventSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    properties = serializers.DictField(required=False, default=dict)
    path = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    title = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")


class _BatchSerializer(serializers.Serializer):
    events = _EventSerializer(many=True)
    referrer = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=""
    )
    utm = serializers.DictField(required=False, default=dict)


class TrackThrottle(AnonRateThrottle):
    """
    60 requests per minute per IP. Each request can carry a batch of
    events, so a real user generates ~5–10 requests/min at most.
    """

    rate = "60/minute"


class TrackView(APIView):
    """
    Public, throttled, bot-filtered analytics ingest endpoint.

    Always returns 204 — we never reveal to the caller whether the event
    was actually persisted, so a spammer who gets bot-filtered sees the
    same response as a real visitor and can't iterate to bypass.
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # No CSRF, no JWT — public tracker
    throttle_classes = [TrackThrottle]

    def post(self, request):
        # Respect Do-Not-Track header — if a browser says it doesn't want
        # to be tracked, we don't track it.
        if request.META.get("HTTP_DNT") == "1":
            return Response(status=204)

        ua = request.META.get("HTTP_USER_AGENT", "")
        if is_bot(ua):
            return Response(status=204)

        serializer = _BatchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(status=204)

        data = serializer.validated_data
        if not data.get("events"):
            return Response(status=204)

        # Reject batches with no whitelisted events to avoid wasting any
        # DB cycles on garbage payloads.
        if not any(ev.get("name") in TRACKED_EVENT_NAMES for ev in data["events"]):
            return Response(status=204)

        events = [
            IngestEventPayload(
                name=ev["name"],
                properties=ev.get("properties") or {},
                path=ev.get("path") or "",
                title=ev.get("title") or "",
            )
            for ev in data["events"]
        ]

        batch = IngestBatch(
            events=events,
            referrer=data.get("referrer") or "",
            utm=data.get("utm") or {},
            user_agent=ua,
            ip=client_ip(request),
            country=client_country(request),
            user=request.user if (request.user and request.user.is_authenticated) else None,
        )

        try:
            ingest_batch(batch)
        except Exception:
            # Never let an analytics failure surface to the caller
            pass

        return Response(status=204)
