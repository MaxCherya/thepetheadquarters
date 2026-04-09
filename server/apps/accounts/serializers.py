from django.contrib.auth import password_validation
from rest_framework import serializers

from apps.accounts.models import User, Address


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    gdpr_consent = serializers.BooleanField()

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("auth.email_taken")
        return email

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def validate_gdpr_consent(self, value):
        if not value:
            raise serializers.ValidationError("auth.gdpr_required")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_email_verified",
            "created_at",
        ]
        read_only_fields = ["id", "email", "is_email_verified", "created_at"]


class ProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "label",
            "full_name",
            "address_line_1",
            "address_line_2",
            "city",
            "county",
            "postcode",
            "country",
            "phone",
            "is_default",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AddressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "label",
            "full_name",
            "address_line_1",
            "address_line_2",
            "city",
            "county",
            "postcode",
            "country",
            "phone",
            "is_default",
        ]
