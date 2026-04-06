from django.db import models

from apps.core.models import BaseModel, TranslationBaseModel, SlugMixin, SortableMixin, ActivatableMixin


class Category(BaseModel, SlugMixin, SortableMixin, ActivatableMixin):
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    image = models.URLField(max_length=500, blank=True, default="")
    depth = models.PositiveSmallIntegerField(default=0, db_index=True)
    path = models.CharField(max_length=1000, blank=True, default="")

    class Meta(BaseModel.Meta):
        verbose_name_plural = "categories"
        ordering = ["sort_order", "path"]
        indexes = [
            models.Index(fields=["parent", "is_active"]),
            models.Index(fields=["path"]),
        ]

    def generate_slug(self) -> str:
        translation = self.translations.filter(language="en").first()
        return translation.name if translation else str(self.pk)

    def save(self, *args, **kwargs):
        if self.parent:
            self.depth = self.parent.depth + 1
            self.path = f"{self.parent.path}/{self.slug}" if self.slug else self.parent.path
        else:
            self.depth = 0
            self.path = self.slug or ""
        super().save(*args, **kwargs)

    def __str__(self):
        translation = self.translations.filter(language="en").first()
        return translation.name if translation else str(self.pk)


class CategoryTranslation(TranslationBaseModel):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="translations",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("category", "language")

    def __str__(self):
        return f"{self.name} ({self.language})"
