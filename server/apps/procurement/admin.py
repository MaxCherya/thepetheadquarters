from django.contrib import admin

from apps.procurement.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    StockBatch,
    StockMovement,
)


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ["po_number", "supplier", "status", "total_display", "created_at", "received_at"]
    list_filter = ["status", "supplier"]
    search_fields = ["po_number", "supplier__name", "supplier_invoice_number"]
    readonly_fields = ["po_number", "subtotal", "vat_amount", "total", "received_at", "sent_at"]
    inlines = [PurchaseOrderItemInline]

    @admin.display(description="Total")
    def total_display(self, obj):
        return f"£{obj.total / 100:.2f}"


@admin.register(StockBatch)
class StockBatchAdmin(admin.ModelAdmin):
    list_display = ["variant", "quantity_remaining", "quantity_received", "unit_cost_display", "received_at"]
    list_filter = ["received_at"]
    search_fields = ["variant__sku"]

    @admin.display(description="Unit cost")
    def unit_cost_display(self, obj):
        return f"£{obj.unit_cost / 100:.2f}"


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ["created_at", "variant", "type", "quantity", "total_cost_display", "user"]
    list_filter = ["type", "created_at"]
    search_fields = ["variant__sku"]
    readonly_fields = [f.name for f in StockMovement._meta.fields]

    @admin.display(description="Total cost")
    def total_cost_display(self, obj):
        return f"£{obj.total_cost / 100:.2f}"
