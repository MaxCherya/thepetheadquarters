from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class PurchaseOrder(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent to supplier"
        PARTIAL = "partial", "Partially received"
        RECEIVED = "received", "Fully received"
        CANCELLED = "cancelled", "Cancelled"

    po_number = models.CharField(max_length=12, unique=True, db_index=True)
    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    expected_date = models.DateField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    supplier_invoice_number = models.CharField(max_length=100, blank=True, default="")

    # Totals in pence
    subtotal = models.PositiveIntegerField(default=0)
    vat_amount = models.PositiveIntegerField(default=0)
    shipping_cost = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)

    notes = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_purchase_orders",
    )

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return self.po_number

    @staticmethod
    def generate_po_number():
        last = (
            PurchaseOrder.objects
            .order_by("-created_at")
            .values_list("po_number", flat=True)
            .first()
        )
        if last:
            seq = int(last.split("-")[1]) + 1
        else:
            seq = 1
        return f"PO-{seq:06d}"

    def recalculate_totals(self):
        items = self.items.all()
        self.subtotal = sum(i.unit_cost * i.quantity_ordered for i in items)
        self.vat_amount = sum(i.vat_amount for i in items)
        self.total = self.subtotal + self.vat_amount + self.shipping_cost
        self.save(update_fields=["subtotal", "vat_amount", "total"])


class PurchaseOrderItem(BaseModel):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.PROTECT,
        related_name="purchase_order_items",
    )
    quantity_ordered = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    unit_cost = models.PositiveIntegerField(help_text="Net of VAT, in pence")
    vat_amount = models.PositiveIntegerField(default=0)
    line_total = models.PositiveIntegerField(default=0, help_text="Gross including VAT")

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return f"{self.variant.sku} x{self.quantity_ordered}"

    def save(self, *args, **kwargs):
        # Auto-calculate line_total
        self.line_total = (self.unit_cost * self.quantity_ordered) + self.vat_amount
        super().save(*args, **kwargs)


class StockBatch(BaseModel):
    """A batch of stock received at a specific cost — basis for FIFO consumption."""
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="stock_batches",
    )
    purchase_order_item = models.ForeignKey(
        PurchaseOrderItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="batches",
    )
    quantity_received = models.PositiveIntegerField()
    quantity_remaining = models.PositiveIntegerField()
    unit_cost = models.PositiveIntegerField(help_text="Cost per unit in pence (net of VAT)")
    received_at = models.DateTimeField(db_index=True)
    notes = models.CharField(max_length=255, blank=True, default="")

    class Meta(BaseModel.Meta):
        ordering = ["received_at"]
        indexes = [
            models.Index(fields=["variant", "received_at"]),
        ]

    def __str__(self):
        return f"{self.variant.sku} batch ({self.quantity_remaining}/{self.quantity_received} @ £{self.unit_cost / 100:.2f})"


class StockMovement(BaseModel):
    """Append-only ledger of every stock change."""
    class MovementType(models.TextChoices):
        PURCHASE_RECEIVED = "purchase_received", "Purchase received"
        SALE = "sale", "Sale"
        RETURN = "return", "Customer return"
        ADJUSTMENT = "adjustment", "Manual adjustment"
        DROPSHIP_FULFILLED = "dropship_fulfilled", "Dropship fulfilled"
        REFUND_RESTOCK = "refund_restock", "Refund restock"

    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="stock_movements",
    )
    type = models.CharField(
        max_length=30,
        choices=MovementType.choices,
        db_index=True,
    )
    quantity = models.IntegerField(help_text="Positive = increase, negative = decrease")
    batch = models.ForeignKey(
        StockBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movements",
    )
    order_item = models.ForeignKey(
        "orders.OrderItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    purchase_order_item = models.ForeignKey(
        PurchaseOrderItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    unit_cost_at_time = models.PositiveIntegerField(default=0)
    total_cost = models.PositiveIntegerField(default=0)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    notes = models.TextField(blank=True, default="")

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["variant", "-created_at"]),
            models.Index(fields=["type", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.variant.sku} {self.type} {self.quantity:+d}"
