from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from apps.core.pagination import StandardPagination
from apps.core.responses import success_response, not_found_response

from .models import Category
from .serializers import CategoryListSerializer, CategoryDetailSerializer


class CategoryViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Category.objects
            .filter(is_active=True)
            .prefetch_related("translations")
        )

    def get_language(self):
        return self.request.query_params.get("lang", "en")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.get_language()
        return context

    def list(self, request):
        queryset = self.get_queryset()

        parent_slug = request.query_params.get("parent")
        if parent_slug:
            queryset = queryset.filter(parent__slug=parent_slug)
        else:
            queryset = queryset.filter(parent__isnull=True)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = CategoryListSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)

        serializer = CategoryListSerializer(queryset, many=True, context=self.get_serializer_context())
        return success_response(serializer.data)

    def retrieve(self, request, slug=None):
        try:
            category = self.get_queryset().prefetch_related("children__translations").get(slug=slug)
        except Category.DoesNotExist:
            return not_found_response("category.not_found")

        serializer = CategoryDetailSerializer(category, context=self.get_serializer_context())
        return success_response(serializer.data)

    @action(detail=False, methods=["get"])
    def tree(self, request):
        root_categories = (
            self.get_queryset()
            .filter(parent__isnull=True)
            .prefetch_related("children__translations", "children__children__translations")
        )
        serializer = CategoryDetailSerializer(
            root_categories,
            many=True,
            context=self.get_serializer_context(),
        )
        return success_response(serializer.data)
