from django.db import models

from apps.core.models import BaseModel


class Subscriber(BaseModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return self.email
