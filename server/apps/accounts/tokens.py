import uuid
from datetime import timedelta

import jwt
from django.conf import settings
from django.utils import timezone


def _get_setting(name, default):
    return getattr(settings, name, default)


def generate_access_token(user):
    """Generate a short-lived access token for the given user."""
    lifetime = _get_setting("JWT_ACCESS_TOKEN_LIFETIME", timedelta(minutes=15))
    now = timezone.now()

    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "is_email_verified": user.is_email_verified,
        "token_type": "access",
        "iat": now,
        "exp": now + lifetime,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=_get_setting("JWT_ALGORITHM", "HS256"),
    )


def generate_refresh_token(user):
    """Generate a long-lived refresh token with a trackable jti."""
    from apps.accounts.models import RefreshToken

    lifetime = _get_setting("JWT_REFRESH_TOKEN_LIFETIME", timedelta(days=7))
    now = timezone.now()
    jti = uuid.uuid4()

    RefreshToken.objects.create(
        user=user,
        jti=jti,
        expires_at=now + lifetime,
    )

    payload = {
        "user_id": str(user.id),
        "jti": str(jti),
        "token_type": "refresh",
        "iat": now,
        "exp": now + lifetime,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=_get_setting("JWT_ALGORITHM", "HS256"),
    )


def decode_token(token, expected_type):
    """Decode and validate a JWT token. Returns the payload or raises."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[_get_setting("JWT_ALGORITHM", "HS256")],
        )
    except jwt.ExpiredSignatureError:
        raise TokenError("token_expired")
    except jwt.InvalidTokenError:
        raise TokenError("token_invalid")

    if payload.get("token_type") != expected_type:
        raise TokenError("token_invalid")

    return payload


class TokenError(Exception):
    """Raised when a token is invalid or expired."""

    def __init__(self, code):
        self.code = code
        super().__init__(code)


def set_auth_cookies(response, user):
    """Set both access and refresh token cookies on the response."""
    access_token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)

    is_production = _get_setting("DJANGO_ENV", "development") == "production"
    access_lifetime = _get_setting("JWT_ACCESS_TOKEN_LIFETIME", timedelta(minutes=15))
    refresh_lifetime = _get_setting("JWT_REFRESH_TOKEN_LIFETIME", timedelta(days=7))

    response.set_cookie(
        key="tph_access",
        value=access_token,
        max_age=int(access_lifetime.total_seconds()),
        httponly=True,
        secure=is_production,
        samesite="Lax",
        path="/api/",
    )

    response.set_cookie(
        key="tph_refresh",
        value=refresh_token,
        max_age=int(refresh_lifetime.total_seconds()),
        httponly=True,
        secure=is_production,
        samesite="Lax",
        path="/api/v1/auth/",
    )

    return response


def clear_auth_cookies(response):
    """Remove both auth cookies from the response."""
    response.delete_cookie("tph_access", path="/api/")
    response.delete_cookie("tph_refresh", path="/api/v1/auth/")
    return response
