from django.contrib import admin

from apps.suppliers.models import Supplier, SupplierProduct


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_email", "payment_terms", "is_dropshipper", "is_active"]
    list_filter = ["is_dropshipper", "is_active", "payment_terms"]
    search_fields = ["name", "contact_email"]


@admin.register(SupplierProduct)
class SupplierProductAdmin(admin.ModelAdmin):
    list_display = ["supplier", "variant", "supplier_sku", "last_cost", "is_preferred"]
    list_filter = ["is_preferred", "supplier"]
    search_fields = ["supplier_sku", "variant__sku"]
