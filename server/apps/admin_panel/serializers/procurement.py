from rest_framework import serializers

from apps.procurement.models import PurchaseOrder, PurchaseOrderItem


class AdminPurchaseOrderListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "po_number",
            "supplier",
            "supplier_name",
            "status",
            "expected_date",
            "subtotal",
            "vat_amount",
            "total",
            "item_count",
            "created_at",
            "received_at",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class AdminPurchaseOrderItemSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id",
            "variant",
            "variant_sku",
            "product_name",
            "quantity_ordered",
            "quantity_received",
            "unit_cost",
            "vat_amount",
            "line_total",
        ]

    def get_product_name(self, obj):
        t = obj.variant.product.translations.filter(language="en").first()
        return t.name if t else ""


class AdminPurchaseOrderDetailSerializer(serializers.ModelSerializer):
    items = AdminPurchaseOrderItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    supplier_email = serializers.CharField(source="supplier.contact_email", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "po_number",
            "supplier",
            "supplier_name",
            "supplier_email",
            "status",
            "expected_date",
            "sent_at",
            "received_at",
            "cancelled_at",
            "supplier_invoice_number",
            "subtotal",
            "vat_amount",
            "shipping_cost",
            "total",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]


class AdminPurchaseOrderItemWriteSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity_ordered = serializers.IntegerField(min_value=1)
    unit_cost = serializers.IntegerField(min_value=0)
    vat_amount = serializers.IntegerField(min_value=0, default=0)


class AdminPurchaseOrderWriteSerializer(serializers.Serializer):
    supplier_id = serializers.UUIDField()
    expected_date = serializers.DateField(required=False, allow_null=True)
    supplier_invoice_number = serializers.CharField(required=False, allow_blank=True, default="")
    shipping_cost = serializers.IntegerField(min_value=0, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    items = AdminPurchaseOrderItemWriteSerializer(many=True)


class AdminPurchaseOrderReceiveItemSerializer(serializers.Serializer):
    po_item_id = serializers.UUIDField()
    quantity_received = serializers.IntegerField(min_value=1)


class AdminPurchaseOrderReceiveSerializer(serializers.Serializer):
    items = AdminPurchaseOrderReceiveItemSerializer(many=True)
