from django.db import models

from apps.core.models import BaseModel, TranslationBaseModel, SlugMixin, SortableMixin, ActivatableMixin


class Brand(BaseModel, SlugMixin, SortableMixin, ActivatableMixin):
    logo = models.URLField(max_length=500, blank=True, default="")
    website = models.URLField(max_length=500, blank=True, default="")

    class Meta(BaseModel.Meta):
        ordering = ["sort_order"]

    def generate_slug(self) -> str:
        translation = self.translations.filter(language="en").first()
        return translation.name if translation else str(self.pk)

    def __str__(self):
        translation = self.translations.filter(language="en").first()
        return translation.name if translation else str(self.pk)


class BrandTranslation(TranslationBaseModel):
    brand = models.ForeignKey(
        Brand,
        on_delete=models.CASCADE,
        related_name="translations",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("brand", "language")

    def __str__(self):
        return f"{self.name} ({self.language})"
