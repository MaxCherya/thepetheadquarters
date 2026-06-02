"""
Admin shipping settings — live edit of the storefront's free-shipping
threshold and flat rate without a redeploy.
"""

from apps.core.responses import (
    error_response,
    success_response,
    validation_error_response,
)
from apps.orders.models import ShippingSettings
from apps.admin_panel.views.base import AdminBaseView


def _serialize(cfg: ShippingSettings) -> dict:
    return {
        "free_threshold_pence": cfg.free_threshold_pence,
        "flat_rate_pence": cfg.flat_rate_pence,
    }


class AdminShippingSettingsView(AdminBaseView):
    """GET + PATCH the singleton shipping config."""

    required_permissions = {
        "GET": "orders.view",
        "PATCH": "orders.update",
    }

    def get(self, request):
        return success_response(data=_serialize(ShippingSettings.current()))

    def patch(self, request):
        cfg = ShippingSettings.current()
        errors: dict = {}

        for field in ("free_threshold_pence", "flat_rate_pence"):
            if field in request.data:
                raw = request.data.get(field)
                try:
                    value = int(raw)
                except (TypeError, ValueError):
                    errors[field] = "must be an integer (pence)"
                    continue
                if value < 0:
                    errors[field] = "must be zero or positive"
                    continue
                setattr(cfg, field, value)

        if errors:
            return validation_error_response(errors)

        cfg.save(update_fields=["free_threshold_pence", "flat_rate_pence"])
        return success_response(data=_serialize(cfg))
