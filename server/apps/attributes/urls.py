from django.urls import path

from .viewsets import AttributeViewSet

viewset = AttributeViewSet

urlpatterns = [
    path("attributes/", viewset.as_view({"get": "list"}), name="attribute-list"),
    path("attributes/product/<uuid:product_id>/", viewset.as_view({"get": "by_product"}), name="attribute-by-product"),
]
