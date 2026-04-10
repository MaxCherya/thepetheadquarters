from django.db import transaction
from django.db.models import Q

from apps.core.responses import (
    created_response,
    error_response,
    success_response,
    validation_error_response,
)

from apps.products.models import (
    Product,
    ProductCategory,
    ProductImage,
    ProductTranslation,
    ProductVariant,
)
from apps.admin_panel.pagination import AdminPagination
from apps.admin_panel.serializers.products import (
    AdminImageWriteSerializer,
    AdminProductDetailSerializer,
    AdminProductListSerializer,
    AdminProductWriteSerializer,
    AdminVariantWriteSerializer,
)
from apps.admin_panel.views.base import AdminBaseView


class AdminProductListView(AdminBaseView):
    def get(self, request):
        from django.db.models import Sum, Min, Q

        qs = (
            Product.objects.all()
            .prefetch_related("translations", "variants", "images", "product_categories")
        )

        # Annotate with aggregates for filtering and sorting
        qs = qs.annotate(
            total_stock=Sum("variants__stock_quantity"),
            min_price=Min("variants__price"),
        )

        # Filters
        if request.query_params.get("category"):
            qs = qs.filter(product_categories__category_id=request.query_params["category"])
        if request.query_params.get("brand"):
            qs = qs.filter(brand_id=request.query_params["brand"])
        if request.query_params.get("fulfillment_type"):
            qs = qs.filter(fulfillment_type=request.query_params["fulfillment_type"])
        if request.query_params.get("is_active") is not None:
            qs = qs.filter(is_active=request.query_params["is_active"] == "true")
        if request.query_params.get("is_featured") is not None:
            qs = qs.filter(is_featured=request.query_params["is_featured"] == "true")

        # Stock level filter
        stock = request.query_params.get("stock")
        if stock == "out":
            qs = qs.filter(Q(total_stock=0) | Q(total_stock__isnull=True))
        elif stock == "low":
            qs = qs.filter(total_stock__gt=0, total_stock__lt=10)
        elif stock == "in":
            qs = qs.filter(total_stock__gte=10)

        # Price range (in pence)
        min_price_filter = request.query_params.get("min_price")
        if min_price_filter:
            try:
                qs = qs.filter(min_price__gte=int(min_price_filter))
            except ValueError:
                pass
        max_price_filter = request.query_params.get("max_price")
        if max_price_filter:
            try:
                qs = qs.filter(min_price__lte=int(max_price_filter))
            except ValueError:
                pass

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(translations__name__icontains=search)
                | Q(slug__icontains=search)
                | Q(variants__sku__icontains=search)
            ).distinct()

        # Sorting
        ordering = request.query_params.get("ordering", "-created_at")
        allowed_orderings = {
            "created_at", "-created_at",
            "min_price", "-min_price",
            "total_stock", "-total_stock",
        }
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-created_at")

        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(AdminProductListSerializer(page, many=True).data)

    @transaction.atomic
    def post(self, request):
        serializer = AdminProductWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        data = serializer.validated_data

        product = Product.objects.create(
            brand_id=data.get("brand_id"),
            fulfillment_type=data["fulfillment_type"],
            is_featured=data["is_featured"],
            is_active=data["is_active"],
            meta_title=data.get("meta_title", ""),
            meta_description=data.get("meta_description", ""),
        )

        ProductTranslation.objects.create(
            product=product,
            language="en",
            name=data["name"],
            description=data.get("description", ""),
            short_description=data.get("short_description", ""),
        )

        product.slug = None
        product.save()

        for cat_id in data.get("category_ids", []):
            ProductCategory.objects.create(product=product, category_id=cat_id)

        return created_response(data=AdminProductDetailSerializer(product).data)


class AdminProductDetailView(AdminBaseView):
    def _get(self, product_id):
        try:
            return Product.objects.prefetch_related(
                "translations", "variants", "images", "product_categories"
            ).get(id=product_id)
        except Product.DoesNotExist:
            return None

    def get(self, request, product_id):
        product = self._get(product_id)
        if not product:
            return error_response("admin.products.not_found", status_code=404)
        return success_response(data=AdminProductDetailSerializer(product).data)

    @transaction.atomic
    def patch(self, request, product_id):
        product = self._get(product_id)
        if not product:
            return error_response("admin.products.not_found", status_code=404)

        serializer = AdminProductWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        data = serializer.validated_data

        for field in ["brand_id", "fulfillment_type", "is_featured", "is_active", "meta_title", "meta_description"]:
            if field in data:
                setattr(product, field, data[field])

        # Update translation if name/description provided
        if "name" in data or "description" in data or "short_description" in data:
            translation, _ = ProductTranslation.objects.get_or_create(
                product=product, language="en",
                defaults={"name": data.get("name", "")},
            )
            if "name" in data:
                translation.name = data["name"]
            if "description" in data:
                translation.description = data["description"]
            if "short_description" in data:
                translation.short_description = data["short_description"]
            translation.save()

        # Replace categories if provided
        if "category_ids" in data:
            product.product_categories.all().delete()
            for cat_id in data["category_ids"]:
                ProductCategory.objects.create(product=product, category_id=cat_id)

        product.save()
        return success_response(data=AdminProductDetailSerializer(product).data)

    def delete(self, request, product_id):
        product = self._get(product_id)
        if not product:
            return error_response("admin.products.not_found", status_code=404)
        product.is_active = False
        product.save(update_fields=["is_active"])
        return success_response()


class AdminProductVariantsView(AdminBaseView):
    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return error_response("admin.products.not_found", status_code=404)

        serializer = AdminVariantWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        variant = ProductVariant.objects.create(product=product, **serializer.validated_data)
        return created_response(
            data={
                "id": str(variant.id),
                "sku": variant.sku,
                "price": variant.price,
                "stock_quantity": variant.stock_quantity,
            }
        )


class AdminVariantDetailView(AdminBaseView):
    def patch(self, request, variant_id):
        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return error_response("admin.variants.not_found", status_code=404)

        serializer = AdminVariantWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        for field, value in serializer.validated_data.items():
            setattr(variant, field, value)
        variant.save()

        return success_response(data={"id": str(variant.id), "sku": variant.sku})

    def delete(self, request, variant_id):
        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return error_response("admin.variants.not_found", status_code=404)
        variant.is_active = False
        variant.save(update_fields=["is_active"])
        return success_response()


class AdminProductImagesView(AdminBaseView):
    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return error_response("admin.products.not_found", status_code=404)

        serializer = AdminImageWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)

        data = serializer.validated_data
        image = ProductImage.objects.create(
            product=product,
            variant_id=data.get("variant_id"),
            url=data["url"],
            alt_text=data.get("alt_text", ""),
            is_primary=data.get("is_primary", False),
            sort_order=data.get("sort_order", 0),
        )
        return created_response(data={"id": str(image.id), "url": image.url})


class AdminImageDetailView(AdminBaseView):
    def _get(self, image_id):
        try:
            return ProductImage.objects.get(id=image_id)
        except ProductImage.DoesNotExist:
            return None

    @transaction.atomic
    def patch(self, request, image_id):
        image = self._get(image_id)
        if not image:
            return error_response("admin.images.not_found", status_code=404)

        if "is_primary" in request.data:
            new_primary = bool(request.data["is_primary"])
            if new_primary:
                # Unset other primary images for the same product
                ProductImage.objects.filter(
                    product_id=image.product_id, is_primary=True
                ).exclude(id=image.id).update(is_primary=False)
            image.is_primary = new_primary

        if "alt_text" in request.data:
            image.alt_text = request.data["alt_text"]
        if "sort_order" in request.data:
            image.sort_order = int(request.data["sort_order"])

        image.save()
        return success_response(data={
            "id": str(image.id),
            "url": image.url,
            "is_primary": image.is_primary,
            "alt_text": image.alt_text,
            "sort_order": image.sort_order,
        })

    def delete(self, request, image_id):
        image = self._get(image_id)
        if not image:
            return error_response("admin.images.not_found", status_code=404)
        image.delete()
        return success_response()
