from django.db.models import Q
from rest_framework import serializers

from apps.core.responses import (
    created_response,
    error_response,
    success_response,
    validation_error_response,
)

from apps.suppliers.models import Supplier, SupplierProduct
from apps.procurement.models import PurchaseOrder
from apps.admin_panel.pagination import AdminPagination
from apps.admin_panel.views.base import AdminBaseView


class AdminSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "contact_email",
            "contact_phone",
            "address_line_1",
            "address_line_2",
            "city",
            "postcode",
            "country",
            "payment_terms",
            "is_dropshipper",
            "is_active",
            "notes",
            "created_at",
        ]


class AdminSupplierProductSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = SupplierProduct
        fields = [
            "id",
            "supplier",
            "variant",
            "variant_sku",
            "product_name",
            "supplier_sku",
            "supplier_url",
            "last_cost",
            "last_purchased_at",
            "is_preferred",
            "notes",
        ]

    def get_product_name(self, obj):
        t = obj.variant.product.translations.filter(language="en").first()
        return t.name if t else ""


class AdminSupplierListView(AdminBaseView):
    def get(self, request):
        qs = Supplier.objects.all()

        if request.query_params.get("dropshipper") == "true":
            qs = qs.filter(is_dropshipper=True)
        elif request.query_params.get("dropshipper") == "false":
            qs = qs.filter(is_dropshipper=False)

        if request.query_params.get("is_active") == "true":
            qs = qs.filter(is_active=True)
        elif request.query_params.get("is_active") == "false":
            qs = qs.filter(is_active=False)

        if request.query_params.get("country"):
            qs = qs.filter(country__iexact=request.query_params["country"])

        if request.query_params.get("payment_terms"):
            qs = qs.filter(payment_terms=request.query_params["payment_terms"])

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(contact_email__icontains=search)
                | Q(city__icontains=search)
            )

        ordering = request.query_params.get("ordering", "name")
        allowed = {"name", "-name", "created_at", "-created_at"}
        if ordering in allowed:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("name")

        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(AdminSupplierSerializer(page, many=True).data)

    def post(self, request):
        serializer = AdminSupplierSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)
        supplier = serializer.save()
        return created_response(data=AdminSupplierSerializer(supplier).data)


class AdminSupplierDetailView(AdminBaseView):
    def _get(self, supplier_id):
        try:
            return Supplier.objects.get(id=supplier_id)
        except Supplier.DoesNotExist:
            return None

    def get(self, request, supplier_id):
        supplier = self._get(supplier_id)
        if not supplier:
            return error_response("admin.suppliers.not_found", status_code=404)
        return success_response(data=AdminSupplierSerializer(supplier).data)

    def patch(self, request, supplier_id):
        supplier = self._get(supplier_id)
        if not supplier:
            return error_response("admin.suppliers.not_found", status_code=404)
        serializer = AdminSupplierSerializer(supplier, data=request.data, partial=True)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)
        supplier = serializer.save()
        return success_response(data=AdminSupplierSerializer(supplier).data)

    def delete(self, request, supplier_id):
        supplier = self._get(supplier_id)
        if not supplier:
            return error_response("admin.suppliers.not_found", status_code=404)
        supplier.is_active = False
        supplier.save(update_fields=["is_active"])
        return success_response()


class AdminSupplierProductsView(AdminBaseView):
    def get(self, request, supplier_id):
        items = SupplierProduct.objects.filter(supplier_id=supplier_id).select_related("variant__product")
        return success_response(data=AdminSupplierProductSerializer(items, many=True).data)

    def post(self, request, supplier_id):
        try:
            supplier = Supplier.objects.get(id=supplier_id)
        except Supplier.DoesNotExist:
            return error_response("admin.suppliers.not_found", status_code=404)

        data = {**request.data, "supplier": str(supplier.id)}
        serializer = AdminSupplierProductSerializer(data=data)
        if not serializer.is_valid():
            return validation_error_response(serializer.errors)
        link = serializer.save()
        return created_response(data=AdminSupplierProductSerializer(link).data)


class AdminSupplierPurchasesView(AdminBaseView):
    def get(self, request, supplier_id):
        from apps.admin_panel.serializers.procurement import AdminPurchaseOrderListSerializer
        pos = PurchaseOrder.objects.filter(supplier_id=supplier_id).order_by("-created_at")
        return success_response(data=AdminPurchaseOrderListSerializer(pos, many=True).data)
