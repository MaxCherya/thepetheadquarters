from django.db import models

from apps.core.models import BaseModel, TranslationBaseModel, SortableMixin


class Attribute(BaseModel, SortableMixin):
    """Spec definition: Life Stage, Material, Breed Size, etc."""

    class AttributeType(models.TextChoices):
        TEXT = "text", "Text"
        NUMBER = "number", "Number"
        BOOLEAN = "boolean", "Boolean"
        SELECT = "select", "Select"
        MULTI_SELECT = "multi_select", "Multi-Select"

    key = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=AttributeType.choices, default=AttributeType.TEXT)
    unit = models.CharField(max_length=20, blank=True, default="")
    is_filterable = models.BooleanField(default=False, db_index=True)

    class Meta(BaseModel.Meta):
        ordering = ["sort_order"]

    def __str__(self):
        translation = self.translations.filter(language="en").first()
        return translation.name if translation else self.key


class AttributeTranslation(TranslationBaseModel):
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE,
        related_name="translations",
    )
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ("attribute", "language")

    def __str__(self):
        return f"{self.name} ({self.language})"


class AttributeValue(BaseModel, SortableMixin):
    """Predefined option for select/multi-select: Puppy, Adult, Senior, etc."""
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE,
        related_name="values",
    )

    class Meta(BaseModel.Meta):
        ordering = ["sort_order"]

    def __str__(self):
        translation = self.translations.filter(language="en").first()
        return translation.value if translation else str(self.pk)


class AttributeValueTranslation(TranslationBaseModel):
    attribute_value = models.ForeignKey(
        AttributeValue,
        on_delete=models.CASCADE,
        related_name="translations",
    )
    value = models.CharField(max_length=300)

    class Meta:
        unique_together = ("attribute_value", "language")

    def __str__(self):
        return f"{self.value} ({self.language})"


class CategoryAttribute(BaseModel, SortableMixin):
    """Which attributes apply to which category."""
    category_id = models.UUIDField(db_index=True)
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE,
        related_name="category_assignments",
    )
    is_required = models.BooleanField(default=False)

    class Meta:
        unique_together = ("category_id", "attribute")
        ordering = ["sort_order"]


class ProductAttributeValue(BaseModel):
    """Actual spec value assigned to a product."""
    product_id = models.UUIDField(db_index=True)
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE,
        related_name="product_values",
    )
    value_text = models.CharField(max_length=500, blank=True, default="")
    value_number = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    attribute_value = models.ForeignKey(
        AttributeValue,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="product_assignments",
    )

    class Meta:
        indexes = [
            models.Index(fields=["product_id", "attribute"]),
            models.Index(fields=["attribute", "attribute_value"]),
        ]

    def __str__(self):
        return f"Product {self.product_id} — {self.attribute}: {self.get_display_value()}"

    def get_display_value(self) -> str:
        if self.attribute_value:
            t = self.attribute_value.translations.filter(language="en").first()
            return t.value if t else ""
        if self.value_number is not None:
            return str(self.value_number)
        return self.value_text
