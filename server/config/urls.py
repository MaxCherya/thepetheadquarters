from django.http import JsonResponse
from django.urls import include, path

from apps.accounts.urls import address_urlpatterns, auth_urlpatterns

urlpatterns = [
    path("api/v1/auth/", include(auth_urlpatterns)),
    path("api/v1/addresses/", include(address_urlpatterns)),
    path("api/v1/", include("apps.categories.urls")),
    path("api/v1/", include("apps.brands.urls")),
    path("api/v1/", include("apps.products.urls")),
    path("api/v1/", include("apps.attributes.urls")),
    path("api/v1/", include("apps.newsletter.urls")),
    path("api/v1/", include("apps.contact.urls")),
]


def handler404(request, exception):
    return JsonResponse({"status": "error", "code": "common.not_found"}, status=404)


handler404 = handler404
