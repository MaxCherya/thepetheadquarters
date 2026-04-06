from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle

from apps.core.responses import created_response, error_response, validation_error_response

from .models import Subscriber
from .serializers import SubscribeSerializer


class NewsletterThrottle(AnonRateThrottle):
    rate = "5/minute"


class SubscribeView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [NewsletterThrottle]

    def post(self, request):
        # Honeypot check — bots fill hidden fields
        if request.data.get("website"):
            # Silently accept to not tip off the bot
            return created_response({"code": "newsletter.subscribed"})

        serializer = SubscribeSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        email = serializer.validated_data["email"]

        subscriber, created = Subscriber.objects.get_or_create(
            email=email,
            defaults={"is_active": True},
        )

        if not created and subscriber.is_active:
            return error_response("newsletter.already_subscribed")

        if not created and not subscriber.is_active:
            subscriber.is_active = True
            subscriber.save(update_fields=["is_active", "updated_at"])

        return created_response({"code": "newsletter.subscribed"})
