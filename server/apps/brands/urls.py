from django.urls import path

from .viewsets import BrandViewSet

viewset = BrandViewSet

urlpatterns = [
    path("brands/", viewset.as_view({"get": "list"}), name="brand-list"),
    path("brands/<slug:slug>/", viewset.as_view({"get": "retrieve"}), name="brand-detail"),
]
