from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["created_at", "user", "action", "model_name", "object_id"]
    list_filter = ["action", "model_name", "created_at"]
    search_fields = ["object_id", "object_repr", "user__email"]
    readonly_fields = [f.name for f in AuditLog._meta.fields]
