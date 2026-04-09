import uuid
import secrets

from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel


class UserManager(BaseUserManager):
    """Custom manager using email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_email_verified", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user model with email as the primary identifier."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)

    is_email_verified = models.BooleanField(default=False)

    gdpr_consent = models.BooleanField(default=False)
    gdpr_consent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class EmailVerificationToken(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_tokens",
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    @staticmethod
    def generate(user):
        token = secrets.token_urlsafe(48)
        expiry_hours = getattr(settings, "EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS", 24)
        return EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timezone.timedelta(hours=expiry_hours),
        )

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()


class PasswordResetToken(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    @staticmethod
    def generate(user):
        token = secrets.token_urlsafe(48)
        expiry_hours = getattr(settings, "PASSWORD_RESET_TOKEN_EXPIRY_HOURS", 1)
        return PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timezone.timedelta(hours=expiry_hours),
        )

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()


class RefreshToken(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="refresh_tokens",
    )
    jti = models.UUIDField(unique=True, default=uuid.uuid4, db_index=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_valid(self):
        return self.revoked_at is None and self.expires_at > timezone.now()

    def revoke(self):
        self.revoked_at = timezone.now()
        self.save(update_fields=["revoked_at"])


class Address(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    label = models.CharField(max_length=50, blank=True)
    full_name = models.CharField(max_length=255)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    county = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=10)
    country = models.CharField(max_length=2, default="GB")
    phone = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.full_name} — {self.postcode}"
