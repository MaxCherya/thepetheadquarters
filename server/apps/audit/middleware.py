"""
Middleware that captures the current request into a thread-local context,
so audit signal handlers can attribute writes to the user/IP/UA.
"""

import threading

_local = threading.local()


def get_current_request():
    return getattr(_local, "request", None)


def get_current_user():
    request = get_current_request()
    if request is None:
        return None
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        return user
    return None


def get_client_ip(request):
    if not request:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class AuditContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request = request
        try:
            return self.get_response(request)
        finally:
            _local.request = None
