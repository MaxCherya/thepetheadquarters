from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.core.responses import success_response

from .models import Attribute, ProductAttributeValue
from .serializers import AttributeSerializer, ProductAttributeValueSerializer


class AttributeViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    def get_language(self):
        return self.request.query_params.get("lang", "en")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.get_language()
        return context

    def list(self, request):
        category_id = request.query_params.get("category")
        if category_id:
            attribute_ids = (
                Attribute.objects
                .filter(category_assignments__category_id=category_id)
                .values_list("id", flat=True)
            )
            queryset = (
                Attribute.objects
                .filter(id__in=attribute_ids, is_filterable=True)
                .prefetch_related("translations", "values__translations")
            )
        else:
            queryset = (
                Attribute.objects
                .filter(is_filterable=True)
                .prefetch_related("translations", "values__translations")
            )

        serializer = AttributeSerializer(queryset, many=True, context=self.get_serializer_context())
        return success_response(serializer.data)

    def by_product(self, request, product_id=None):
        values = (
            ProductAttributeValue.objects
            .filter(product_id=product_id)
            .select_related("attribute", "attribute_value")
            .prefetch_related(
                "attribute__translations",
                "attribute_value__translations",
            )
        )
        serializer = ProductAttributeValueSerializer(
            values,
            many=True,
            context=self.get_serializer_context(),
        )
        return success_response(serializer.data)
