from rest_framework import serializers

from .models import Brand, BrandTranslation


class BrandTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandTranslation
        fields = ["language", "name", "description"]


class BrandListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ["id", "slug", "name", "logo"]

    def get_name(self, obj) -> str:
        lang = self.context.get("language", "en")
        translation = obj.translations.filter(language=lang).first()
        if not translation:
            translation = obj.translations.filter(language="en").first()
        return translation.name if translation else ""


class BrandDetailSerializer(BrandListSerializer):
    translations = BrandTranslationSerializer(many=True, read_only=True)
    description = serializers.SerializerMethodField()

    class Meta(BrandListSerializer.Meta):
        fields = ["id", "slug", "name", "description", "logo", "website", "translations"]

    def get_description(self, obj) -> str:
        lang = self.context.get("language", "en")
        translation = obj.translations.filter(language=lang).first()
        if not translation:
            translation = obj.translations.filter(language="en").first()
        return translation.description if translation else ""
