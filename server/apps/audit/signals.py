"""
Signal handlers that auto-write AuditLog entries when tracked models change.
Only logs when the action is performed by an authenticated staff user.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.audit.middleware import (
    get_current_request,
    get_current_user,
    get_client_ip,
)
from apps.audit.models import AuditLog


# Tracked model identifiers — "app_label.ModelName"
TRACKED_MODELS = {
    "orders.Order",
    "orders.OrderItem",
    "products.Product",
    "products.ProductVariant",
    "products.ProductImage",
    "suppliers.Supplier",
    "suppliers.SupplierProduct",
    "procurement.PurchaseOrder",
    "procurement.PurchaseOrderItem",
    "procurement.StockBatch",
    "procurement.StockMovement",
    "brands.Brand",
    "categories.Category",
}

# Fields to exclude from before/after snapshots (noisy or huge)
EXCLUDED_FIELDS = {"updated_at", "_state"}


def _model_label(instance):
    return f"{instance._meta.app_label}.{instance.__class__.__name__}"


def _serialize_instance(instance):
    """Capture model fields as a JSON-friendly dict (best-effort)."""
    data = {}
    for field in instance._meta.fields:
        if field.name in EXCLUDED_FIELDS:
            continue
        try:
            value = getattr(instance, field.name)
            if hasattr(value, "isoformat"):
                value = value.isoformat()
            elif hasattr(value, "pk"):
                value = str(value.pk)
            elif value is None or isinstance(value, (str, int, float, bool, list, dict)):
                pass
            else:
                value = str(value)
            data[field.name] = value
        except Exception:
            data[field.name] = None
    return data


def _log(action, instance, before=None):
    label = _model_label(instance)
    if label not in TRACKED_MODELS:
        return

    user = get_current_user()
    request = get_current_request()

    # Only log writes initiated by an authenticated staff user
    if not user or not getattr(user, "is_staff", False):
        return

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk),
        object_repr=str(instance)[:300],
        before_data=before,
        after_data=_serialize_instance(instance) if action != AuditLog.Action.DELETE else None,
        ip_address=get_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT", "") if request else "")[:500],
    )


@receiver(post_save)
def on_save(sender, instance, created, **kwargs):
    label = _model_label(instance)
    if label not in TRACKED_MODELS:
        return
    action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE
    _log(action, instance)


@receiver(post_delete)
def on_delete(sender, instance, **kwargs):
    label = _model_label(instance)
    if label not in TRACKED_MODELS:
        return
    _log(AuditLog.Action.DELETE, instance)
