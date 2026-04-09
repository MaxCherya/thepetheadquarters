from rest_framework.permissions import BasePermission


class IsEmailVerified(BasePermission):
    """
    Allow access only to users with a verified email address.
    Used as a gate for checkout and other sensitive operations.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_email_verified
        )
