import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.text import slugify


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class TranslationBaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.CharField(max_length=10, db_index=True)

    class Meta:
        abstract = True


class SlugHistory(models.Model):
    """
    Records every old slug a SlugMixin object has had, so the frontend can
    301-redirect old URLs to the current canonical slug. Without this, any
    rename of a product/category/brand instantly breaks every external link
    Google has indexed.

    Uses Django's contenttypes framework so a single table covers products,
    brands, and categories without per-model boilerplate.
    """

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="+",
    )
    object_id = models.UUIDField()
    target = GenericForeignKey("content_type", "object_id")
    old_slug = models.SlugField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # An old slug can't point to two different objects of the same
            # type (e.g. two products that both used to be called "abc").
            # We resolve this by always pointing to the most-recently-renamed
            # object — the conflict is enforced at the application layer in
            # SlugMixin.save() so renaming an object detaches its old slug
            # from any prior owner of the same string.
            models.UniqueConstraint(
                fields=["content_type", "old_slug"],
                name="uniq_slug_history_per_type",
            ),
        ]
        indexes = [
            models.Index(fields=["content_type", "old_slug"]),
        ]

    def __str__(self) -> str:
        return f"{self.content_type.model}: {self.old_slug} → {self.object_id}"


class SlugMixin(models.Model):
    slug = models.SlugField(max_length=255, unique=True, blank=True)

    class Meta:
        abstract = True

    def generate_slug(self) -> str:
        raise NotImplementedError("Subclasses must implement generate_slug()")

    def save(self, *args, **kwargs):
        # Detect a slug change on an existing row so we can record the old
        # value for 301-redirect lookups. We DO NOT auto-regenerate the slug
        # from the name on save — once a slug exists, it's the canonical URL
        # and the admin must explicitly clear it to trigger a rename.
        old_slug = None
        if self.pk:
            try:
                old_row = self.__class__.objects.only("slug").get(pk=self.pk)
                old_slug = old_row.slug
            except self.__class__.DoesNotExist:
                old_slug = None

        if not self.slug:
            base_slug = slugify(self.generate_slug())
            slug = base_slug
            model = self.__class__
            counter = 1
            while model.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        super().save(*args, **kwargs)

        # If the slug actually changed (rename), record the history row.
        # Skip if the old slug was empty (first save) or matches the new one.
        if old_slug and old_slug != self.slug:
            ct = ContentType.objects.get_for_model(self.__class__)
            # Detach any prior history row for this old_slug under the same
            # content type — the most-recently-renamed object wins.
            SlugHistory.objects.filter(
                content_type=ct,
                old_slug=old_slug,
            ).delete()
            SlugHistory.objects.create(
                content_type=ct,
                object_id=self.pk,
                old_slug=old_slug,
            )


class SortableMixin(models.Model):
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ["sort_order"]


class ActivatableMixin(models.Model):
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        abstract = True
