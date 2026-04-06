from django.urls import path

from .viewsets import CategoryViewSet

viewset = CategoryViewSet

urlpatterns = [
    path("categories/", viewset.as_view({"get": "list"}), name="category-list"),
    path("categories/tree/", viewset.as_view({"get": "tree"}), name="category-tree"),
    path("categories/<slug:slug>/", viewset.as_view({"get": "retrieve"}), name="category-detail"),
]
