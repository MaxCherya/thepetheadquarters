class CacheControlMiddleware:
    """
    Adds Cache-Control headers to public GET API responses.
    Admin and auth endpoints get no-store to prevent stale data.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if not request.path.startswith("/api/"):
            return response

        # Admin + auth + orders endpoints must never be cached
        # (sensitive data, must be fresh after mutations)
        if (
            request.path.startswith("/api/v1/admin/")
            or request.path.startswith("/api/v1/auth/")
            or request.path.startswith("/api/v1/orders/")
            or request.path.startswith("/api/v1/addresses/")
        ):
            response["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response["Pragma"] = "no-cache"
            return response

        # Public catalog endpoints (products, categories, brands) — cacheable
        if request.method == "GET" and response.status_code == 200:
            response["Cache-Control"] = "public, max-age=60, s-maxage=120, stale-while-revalidate=300"

        return response
