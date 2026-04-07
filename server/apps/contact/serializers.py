from rest_framework import serializers


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=300, required=False, default="")
    message = serializers.CharField()

    def validate_email(self, value):
        return value.lower().strip()
