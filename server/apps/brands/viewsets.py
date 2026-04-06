from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.core.pagination import StandardPagination
from apps.core.responses import success_response, not_found_response

from .models import Brand
from .serializers import BrandListSerializer, BrandDetailSerializer


class BrandViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    lookup_field = "slug"

    def get_queryset(self):
        return Brand.objects.filter(is_active=True).prefetch_related("translations")

    def get_language(self):
        return self.request.query_params.get("lang", "en")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.get_language()
        return context

    def list(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BrandListSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)

        serializer = BrandListSerializer(queryset, many=True, context=self.get_serializer_context())
        return success_response(serializer.data)

    def retrieve(self, request, slug=None):
        try:
            brand = self.get_queryset().get(slug=slug)
        except Brand.DoesNotExist:
            return not_found_response("brand.not_found")

        serializer = BrandDetailSerializer(brand, context=self.get_serializer_context())
        return success_response(serializer.data)
