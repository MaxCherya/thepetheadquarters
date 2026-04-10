"""
Newsletter service layer.

Handles the side-effects of a successful subscription:
generating a unique single-use welcome promo code and emailing it
to the subscriber.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction

from apps.promotions.models import Promotion
from apps.promotions.services import generate_unique_code

logger = logging.getLogger(__name__)

_is_console_backend = (
    getattr(settings, "EMAIL_BACKEND", "")
    == "django.core.mail.backends.console.EmailBackend"
)


@transaction.atomic
def issue_welcome_promo(*, subscriber_email: str) -> Promotion:
    """
    Create a single-use 10% promo code attributed to a newsletter subscriber.

    The code is unique per subscriber so it cannot be shared or reused —
    each subscriber gets their own code via the welcome email, and the
    promotion is configured with `max_uses_total=1` plus first-order-only
    so the cheating surface is effectively zero.
    """
    code = generate_unique_code(prefix="WELCOME", length=6)

    promotion = Promotion.objects.create(
        code=code,
        name=f"Newsletter welcome — {subscriber_email}",
        description=(
            "Auto-generated single-use 10% off code issued when this subscriber "
            "joined the newsletter."
        ),
        discount_type=Promotion.DiscountType.PERCENT,
        discount_value=10,
        scope=Promotion.Scope.ALL,
        is_first_order_only=True,
        is_one_per_customer=True,
        max_uses_total=1,
        max_uses_per_user=1,
        is_active=True,
        source=Promotion.Source.NEWSLETTER,
        campaign_label="newsletter_welcome",
    )
    return promotion


def send_welcome_email(*, subscriber_email: str, promotion: Promotion) -> None:
    """
    Send the newsletter welcome email containing the unique promo code.
    Falls back to a structured log line on the console email backend (dev).
    """
    site_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    apply_url = f"{site_url}/?promo={promotion.code}"

    if _is_console_backend:
        logger.info(
            "\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  ✉️  Newsletter Welcome — %s\n"
            "  🎁 Code: %s (10%% off first order)\n"
            "  🔗 %s\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            subscriber_email,
            promotion.code,
            apply_url,
        )
        return

    subject = "Welcome to The Pet Headquarters — your 10% off code"
    body = (
        f"Hi there,\n\n"
        f"Thanks for joining our newsletter! Here is your one-time 10% off code "
        f"for your first order:\n\n"
        f"    {promotion.code}\n\n"
        f"Apply it at checkout, or just open this link and it will be added "
        f"automatically:\n\n"
        f"    {apply_url}\n\n"
        f"This code is yours alone and can be used once.\n\n"
        f"— The Pet Headquarters"
    )

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[subscriber_email],
        fail_silently=True,
    )
