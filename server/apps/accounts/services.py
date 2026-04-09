import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

_is_console_backend = (
    getattr(settings, "EMAIL_BACKEND", "")
    == "django.core.mail.backends.console.EmailBackend"
)


def _dev_log(subject, url):
    """Print a clean clickable link in dev when using console email backend."""
    if _is_console_backend:
        logger.info(
            "\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  📧 %s\n"
            "  🔗 %s\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            subject,
            url,
        )


def send_verification_email(user, token):
    """Send email verification link to the user."""
    verification_url = f"{settings.FRONTEND_URL}/account/verify-email?token={token.token}"

    _dev_log("Email Verification", verification_url)

    if _is_console_backend:
        return

    context = {
        "user": user,
        "verification_url": verification_url,
        "site_name": "The Pet Headquarters",
    }

    html_message = render_to_string("accounts/emails/verification.html", context)
    plain_message = render_to_string("accounts/emails/verification.txt", context)

    send_mail(
        subject="Verify your email — The Pet Headquarters",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_reset_email(user, token):
    """Send password reset link to the user."""
    reset_url = f"{settings.FRONTEND_URL}/account/reset-password?token={token.token}"

    _dev_log("Password Reset", reset_url)

    if _is_console_backend:
        return

    context = {
        "user": user,
        "reset_url": reset_url,
        "site_name": "The Pet Headquarters",
        "expiry_hours": getattr(settings, "PASSWORD_RESET_TOKEN_EXPIRY_HOURS", 1),
    }

    html_message = render_to_string("accounts/emails/password_reset.html", context)
    plain_message = render_to_string("accounts/emails/password_reset.txt", context)

    send_mail(
        subject="Reset your password — The Pet Headquarters",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_welcome_email(user):
    """Send a welcome email after email verification."""
    if _is_console_backend:
        logger.info("Welcome email would be sent to %s", user.email)
        return

    context = {
        "user": user,
        "shop_url": f"{settings.FRONTEND_URL}/products",
        "site_name": "The Pet Headquarters",
    }

    html_message = render_to_string("accounts/emails/welcome.html", context)
    plain_message = render_to_string("accounts/emails/welcome.txt", context)

    send_mail(
        subject="Welcome to The Pet Headquarters",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=True,
    )
