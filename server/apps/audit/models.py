from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class AuditLog(BaseModel):
    class Action(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"
        ACTION = "action", "Action"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        db_index=True,
    )
    model_name = models.CharField(max_length=100, db_index=True)
    object_id = models.CharField(max_length=100, db_index=True)
    object_repr = models.CharField(max_length=300, blank=True)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, default="")
    metadata = models.JSONField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.action} {self.model_name} {self.object_id} by {self.user}"
