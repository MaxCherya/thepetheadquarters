from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.accounts.tokens import decode_token, TokenError


class CookieJWTAuthentication(BaseAuthentication):
    """
    Authenticate requests by reading the access token from the
    tph_access httpOnly cookie.

    Falls through silently (returns None) if no cookie is present,
    allowing AllowAny endpoints to work for unauthenticated users.
    """

    def authenticate(self, request):
        access_token = request.COOKIES.get("tph_access")
        if not access_token:
            return None

        try:
            payload = decode_token(access_token, expected_type="access")
        except TokenError:
            return None

        from apps.accounts.models import User

        try:
            user = User.objects.get(id=payload["user_id"], is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed("auth.user_not_found")

        return (user, payload)

    def authenticate_header(self, request):
        return None
