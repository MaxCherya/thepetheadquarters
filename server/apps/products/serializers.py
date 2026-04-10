from rest_framework import serializers

from .models import (
    Product,
    ProductTranslation,
    ProductVariant,
    ProductImage,
    OptionType,
    OptionTypeTranslation,
    OptionValue,
    OptionValueTranslation,
)


def get_translation(obj, lang, fallback="en"):
    translation = obj.translations.filter(language=lang).first()
    if not translation:
        translation = obj.translations.filter(language=fallback).first()
    return translation


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "is_primary", "sort_order", "variant"]


class OptionValueSerializer(serializers.ModelSerializer):
    value = serializers.SerializerMethodField()
    option_type_id = serializers.UUIDField(source="option_type.id", read_only=True)

    class Meta:
        model = OptionValue
        fields = ["id", "value", "option_type_id"]

    def get_value(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj, lang)
        return t.value if t else ""


class OptionTypeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    values = OptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = OptionType
        fields = ["id", "name", "values"]

    def get_name(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj, lang)
        return t.name if t else ""


class ProductVariantSerializer(serializers.ModelSerializer):
    option_values = OptionValueSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "price",
            "compare_at_price",
            "stock_quantity",
            "weight_grams",
            "is_active",
            "is_on_sale",
            "in_stock",
            "sort_order",
            "option_values",
            "images",
        ]


class ProductTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTranslation
        fields = ["language", "name", "description", "short_description"]


class ProductListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    primary_image_alt = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name",
            "short_description",
            "brand_id",
            "is_featured",
            "average_rating",
            "review_count",
            "primary_image",
            "primary_image_alt",
            "min_price",
            "max_price",
            "in_stock",
        ]

    def get_name(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj, lang)
        return t.name if t else ""

    def get_short_description(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj, lang)
        return t.short_description if t else ""

    def _primary_image_obj(self, obj):
        image = obj.images.filter(is_primary=True, variant__isnull=True).first()
        if not image:
            image = obj.images.filter(variant__isnull=True).first()
        return image

    def get_primary_image(self, obj) -> str | None:
        image = self._primary_image_obj(obj)
        return image.url if image else None

    def get_primary_image_alt(self, obj) -> str:
        """Real alt text from the database, used for SEO + a11y."""
        image = self._primary_image_obj(obj)
        return image.alt_text if image else ""

    def get_min_price(self, obj) -> int | None:
        variants = obj.variants.filter(is_active=True)
        if not variants.exists():
            return None
        return variants.order_by("price").first().price

    def get_max_price(self, obj) -> int | None:
        variants = obj.variants.filter(is_active=True)
        if not variants.exists():
            return None
        return variants.order_by("-price").first().price

    def get_in_stock(self, obj) -> bool:
        return obj.variants.filter(is_active=True, stock_quantity__gt=0).exists()


class ProductDetailSerializer(ProductListSerializer):
    translations = ProductTranslationSerializer(many=True, read_only=True)
    description = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True, source="active_variants")
    images = ProductImageSerializer(many=True, read_only=True)
    category_ids = serializers.SerializerMethodField()
    brand = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "short_description",
            "brand_id",
            "brand",
            "is_featured",
            "average_rating",
            "review_count",
            "meta_title",
            "meta_description",
            "primary_image",
            "min_price",
            "max_price",
            "in_stock",
            "translations",
            "variants",
            "images",
            "category_ids",
        ]

    def get_description(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj, lang)
        return t.description if t else ""

    def get_category_ids(self, obj) -> list:
        return list(obj.product_categories.values_list("category_id", flat=True))

    def get_brand(self, obj):
        """Lightweight brand reference for SEO structured data."""
        if not obj.brand_id:
            return None
        from apps.brands.models import Brand
        try:
            brand = Brand.objects.only("id", "slug").get(id=obj.brand_id)
        except Brand.DoesNotExist:
            return None
        translation = brand.translations.filter(language="en").first()
        return {
            "id": str(brand.id),
            "slug": brand.slug,
            "name": translation.name if translation else "",
        }
