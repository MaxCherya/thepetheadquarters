from django.db import models

from apps.core.models import BaseModel


class ContactMessage(BaseModel):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=300, blank=True, default="")
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return f"{self.name} — {self.subject or 'No subject'}"
