from django.db import models

from apps.core.models import BaseModel, ActivatableMixin


class Supplier(BaseModel, ActivatableMixin):
    class PaymentTerms(models.TextChoices):
        COD = "cod", "Cash on Delivery"
        NET_7 = "net_7", "Net 7 days"
        NET_14 = "net_14", "Net 14 days"
        NET_30 = "net_30", "Net 30 days"
        NET_60 = "net_60", "Net 60 days"
        NET_90 = "net_90", "Net 90 days"

    name = models.CharField(max_length=255, db_index=True)
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=20, blank=True, default="")
    address_line_1 = models.CharField(max_length=255, blank=True, default="")
    address_line_2 = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    postcode = models.CharField(max_length=10, blank=True, default="")
    country = models.CharField(max_length=2, default="GB")

    payment_terms = models.CharField(
        max_length=10,
        choices=PaymentTerms.choices,
        default=PaymentTerms.NET_30,
    )
    is_dropshipper = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default="")

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class SupplierProduct(BaseModel):
    """Junction: which variants a supplier provides + their cost/SKU."""
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="products",
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="suppliers",
    )
    supplier_sku = models.CharField(max_length=100, blank=True, default="")
    supplier_url = models.URLField(max_length=500, blank=True, default="")
    last_cost = models.PositiveIntegerField(default=0, help_text="Last purchase cost in pence (net of VAT)")
    last_purchased_at = models.DateTimeField(null=True, blank=True)
    is_preferred = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default="")

    class Meta(BaseModel.Meta):
        unique_together = ("supplier", "variant")
        indexes = [
            models.Index(fields=["variant", "is_preferred"]),
        ]

    def __str__(self):
        return f"{self.supplier.name} → {self.variant.sku}"
