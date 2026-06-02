from django.db.models import Q
from django_filters import rest_framework as filters

from .models import Product


class ProductFilter(filters.FilterSet):
    brand = filters.UUIDFilter(field_name="brand_id")
    category = filters.UUIDFilter(field_name="product_categories__category_id")
    featured = filters.BooleanFilter(field_name="is_featured")
    min_price = filters.NumberFilter(
        field_name="variants__price",
        lookup_expr="gte",
    )
    max_price = filters.NumberFilter(
        field_name="variants__price",
        lookup_expr="lte",
    )
    in_stock = filters.BooleanFilter(method="filter_in_stock")
    search = filters.CharFilter(method="filter_search")

    class Meta:
        model = Product
        fields = []

    def filter_in_stock(self, queryset, name, value):
        # Dropship products are always treated as in-stock when they
        # have at least one active variant — the supplier ships per
        # order, so local stock_quantity is meaningless for them.
        if value:
            return queryset.filter(
                Q(fulfillment_type="dropship", variants__is_active=True)
                | Q(variants__stock_quantity__gt=0, variants__is_active=True)
            ).distinct()
        return queryset

    def filter_search(self, queryset, name, value):
        return queryset.filter(translations__name__icontains=value).distinct()
