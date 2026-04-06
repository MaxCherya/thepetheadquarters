class CacheControlMiddleware:
    """Adds Cache-Control headers to GET API responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            request.method == "GET"
            and request.path.startswith("/api/")
            and response.status_code == 200
        ):
            response["Cache-Control"] = "public, max-age=60, s-maxage=120, stale-while-revalidate=300"

        return response
