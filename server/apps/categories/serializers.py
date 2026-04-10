from rest_framework import serializers

from .models import Category, CategoryTranslation


class CategoryTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryTranslation
        fields = ["language", "name", "description"]


class CategoryListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "slug", "name", "image", "depth", "parent"]

    def get_name(self, obj) -> str:
        lang = self.context.get("language", "en")
        translation = obj.translations.filter(language=lang).first()
        if not translation:
            translation = obj.translations.filter(language="en").first()
        return translation.name if translation else ""


class CategoryDetailSerializer(CategoryListSerializer):
    translations = CategoryTranslationSerializer(many=True, read_only=True)
    children = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta(CategoryListSerializer.Meta):
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "image",
            "depth",
            "parent",
            "path",
            "meta_title",
            "meta_description",
            "translations",
            "children",
        ]

    def get_description(self, obj) -> str:
        lang = self.context.get("language", "en")
        translation = obj.translations.filter(language=lang).first()
        if not translation:
            translation = obj.translations.filter(language="en").first()
        return translation.description if translation else ""

    def get_children(self, obj):
        active_children = obj.children.filter(is_active=True)
        return CategoryListSerializer(
            active_children,
            many=True,
            context=self.context,
        ).data
