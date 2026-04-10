from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.authentication import CookieJWTAuthentication
from apps.accounts.permissions import IsStaff


@method_decorator(csrf_exempt, name="dispatch")
class AdminBaseView(APIView):
    """
    Base view for all admin endpoints.
    Requires cookie-based JWT auth + is_staff flag.

    CSRF is exempt because:
    1. Auth uses httpOnly tph_access cookie with SameSite=Lax,
       which already prevents cross-origin POSTs from sending it.
    2. is_staff permission check ensures only staff users can access.
    3. Same approach as the Stripe webhook handler.
    """
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]
