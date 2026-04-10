from django.contrib import admin

from apps.orders.models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = [
        "product_name", "variant_sku", "variant_option_label",
        "unit_price", "quantity", "line_total", "fulfillment_type",
    ]
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number", "email", "status", "total_display",
        "created_at", "paid_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["order_number", "email", "shipping_postcode"]
    readonly_fields = [
        "order_number", "stripe_checkout_session_id",
        "stripe_payment_intent_id", "paid_at",
    ]
    inlines = [OrderItemInline]

    @admin.display(description="Total")
    def total_display(self, obj):
        return f"£{obj.total / 100:.2f}"
