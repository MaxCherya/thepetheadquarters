from django.db.models import Case, When, Value, BooleanField
from rest_framework.filters import OrderingFilter


class ProductOrderingFilter(OrderingFilter):
    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)

        if ordering:
            # When sorting by rating, push unrated (0) products to the bottom
            if "-average_rating" in ordering:
                queryset = queryset.annotate(
                    has_rating=Case(
                        When(average_rating__gt=0, then=Value(True)),
                        default=Value(False),
                        output_field=BooleanField(),
                    )
                ).order_by("-has_rating", *ordering)
                return queryset

            return queryset.order_by(*ordering)

        return queryset
