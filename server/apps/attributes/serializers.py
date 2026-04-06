from rest_framework import serializers

from .models import Attribute, AttributeValue, ProductAttributeValue


def get_translation(obj, lang, fallback="en"):
    translation = obj.translations.filter(language=lang).first()
    if not translation:
        translation = obj.translations.filter(language=fallback).first()
    return translation


class AttributeValueSerializer(serializers.ModelSerializer):
    value = serializers.SerializerMethodField()

    class Meta:
        model = AttributeValue
        fields = ["id", "value"]

    def get_value(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj, lang)
        return t.value if t else ""


class AttributeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = Attribute
        fields = ["id", "key", "name", "type", "unit", "is_filterable", "values"]

    def get_name(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj, lang)
        return t.name if t else obj.key


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    attribute_key = serializers.CharField(source="attribute.key", read_only=True)
    attribute_name = serializers.SerializerMethodField()
    display_value = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttributeValue
        fields = ["attribute_key", "attribute_name", "display_value"]

    def get_attribute_name(self, obj) -> str:
        lang = self.context.get("language", "en")
        t = get_translation(obj.attribute, lang)
        return t.name if t else obj.attribute.key

    def get_display_value(self, obj) -> str:
        lang = self.context.get("language", "en")
        if obj.attribute_value:
            t = obj.attribute_value.translations.filter(language=lang).first()
            if not t:
                t = obj.attribute_value.translations.filter(language="en").first()
            return t.value if t else ""
        if obj.value_number is not None:
            unit = obj.attribute.unit
            return f"{obj.value_number}{unit}" if unit else str(obj.value_number)
        return obj.value_text
