from rest_framework import serializers

from .models import Subscriber


class SubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()
