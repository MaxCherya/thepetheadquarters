from django.urls import path

from apps.admin_panel.views.dashboard import DashboardView
from apps.admin_panel.views.orders import (
    AdminDropshipPendingView,
    AdminOrderCancelView,
    AdminOrderDetailView,
    AdminOrderForwardItemView,
    AdminOrderListView,
    AdminOrderNotesView,
    AdminOrderRefundView,
    AdminOrderShipView,
    AdminOrderStatusView,
)
from apps.admin_panel.views.products import (
    AdminImageDetailView,
    AdminProductDetailView,
    AdminProductImagesView,
    AdminProductListView,
    AdminProductVariantsView,
    AdminVariantDetailView,
)
from apps.admin_panel.views.inventory import (
    AdminInventoryBatchesView,
    AdminInventoryListView,
    AdminInventoryMovementsView,
    AdminInventoryUpdateView,
)
from apps.admin_panel.views.customers import (
    AdminCustomerDetailView,
    AdminCustomerListView,
)
from apps.admin_panel.views.suppliers import (
    AdminSupplierDetailView,
    AdminSupplierListView,
    AdminSupplierProductsView,
    AdminSupplierPurchasesView,
)
from apps.admin_panel.views.purchase_orders import (
    AdminPurchaseOrderCancelView,
    AdminPurchaseOrderDetailView,
    AdminPurchaseOrderListView,
    AdminPurchaseOrderReceiveView,
    AdminPurchaseOrderSendView,
)
from apps.admin_panel.views.catalog import (
    AdminBrandDetailView,
    AdminBrandListView,
    AdminCategoryDetailView,
    AdminCategoryListView,
)
from apps.admin_panel.views.audit import AdminAuditDetailView, AdminAuditListView
from apps.admin_panel.views.contact import (
    AdminContactMessageDetailView,
    AdminContactMessageListView,
)
from apps.admin_panel.views.promotions import (
    AdminPromotionDetailView,
    AdminPromotionListView,
    AdminPromotionRedemptionsView,
)
from apps.admin_panel.views.reviews import (
    AdminReviewDetailView,
    AdminReviewListView,
)
from apps.admin_panel.views.upload import AdminImageUploadView, AdminUploadInfoView
from apps.admin_panel.views.reports import (
    AdminInventoryValuationView,
    AdminPromotionsReportView,
    AdminSalesReportExportView,
    AdminSalesReportView,
    AdminTopProductsView,
    AdminTopSuppliersView,
    AdminVatReturnExportView,
    AdminVatReturnView,
)

urlpatterns = [
    path("dashboard/", DashboardView.as_view()),

    # Orders
    path("orders/", AdminOrderListView.as_view()),
    path("orders/dropship/", AdminDropshipPendingView.as_view()),
    path("orders/<str:order_number>/", AdminOrderDetailView.as_view()),
    path("orders/<str:order_number>/status/", AdminOrderStatusView.as_view()),
    path("orders/<str:order_number>/ship/", AdminOrderShipView.as_view()),
    path("orders/<str:order_number>/cancel/", AdminOrderCancelView.as_view()),
    path("orders/<str:order_number>/refund/", AdminOrderRefundView.as_view()),
    path("orders/<str:order_number>/notes/", AdminOrderNotesView.as_view()),
    path("orders/<str:order_number>/items/<uuid:item_id>/forward/", AdminOrderForwardItemView.as_view()),

    # Products
    path("products/", AdminProductListView.as_view()),
    path("products/<uuid:product_id>/", AdminProductDetailView.as_view()),
    path("products/<uuid:product_id>/variants/", AdminProductVariantsView.as_view()),
    path("products/<uuid:product_id>/images/", AdminProductImagesView.as_view()),
    path("variants/<uuid:variant_id>/", AdminVariantDetailView.as_view()),
    path("images/<uuid:image_id>/", AdminImageDetailView.as_view()),

    # Inventory
    path("inventory/", AdminInventoryListView.as_view()),
    path("inventory/<uuid:variant_id>/", AdminInventoryUpdateView.as_view()),
    path("inventory/<uuid:variant_id>/movements/", AdminInventoryMovementsView.as_view()),
    path("inventory/<uuid:variant_id>/batches/", AdminInventoryBatchesView.as_view()),

    # Customers
    path("customers/", AdminCustomerListView.as_view()),
    path("customers/<uuid:customer_id>/", AdminCustomerDetailView.as_view()),

    # Suppliers
    path("suppliers/", AdminSupplierListView.as_view()),
    path("suppliers/<uuid:supplier_id>/", AdminSupplierDetailView.as_view()),
    path("suppliers/<uuid:supplier_id>/products/", AdminSupplierProductsView.as_view()),
    path("suppliers/<uuid:supplier_id>/purchases/", AdminSupplierPurchasesView.as_view()),

    # Purchase Orders
    path("purchase-orders/", AdminPurchaseOrderListView.as_view()),
    path("purchase-orders/<uuid:po_id>/", AdminPurchaseOrderDetailView.as_view()),
    path("purchase-orders/<uuid:po_id>/send/", AdminPurchaseOrderSendView.as_view()),
    path("purchase-orders/<uuid:po_id>/receive/", AdminPurchaseOrderReceiveView.as_view()),
    path("purchase-orders/<uuid:po_id>/cancel/", AdminPurchaseOrderCancelView.as_view()),

    # Brands & Categories
    path("brands/", AdminBrandListView.as_view()),
    path("brands/<uuid:brand_id>/", AdminBrandDetailView.as_view()),
    path("categories/", AdminCategoryListView.as_view()),
    path("categories/<uuid:category_id>/", AdminCategoryDetailView.as_view()),

    # Audit
    path("audit/", AdminAuditListView.as_view()),
    path("audit/<uuid:log_id>/", AdminAuditDetailView.as_view()),

    # Contact messages
    path("contact-messages/", AdminContactMessageListView.as_view()),
    path("contact-messages/<uuid:message_id>/", AdminContactMessageDetailView.as_view()),

    # Promotions
    path("promotions/", AdminPromotionListView.as_view()),
    path("promotions/<uuid:promotion_id>/", AdminPromotionDetailView.as_view()),
    path("promotions/<uuid:promotion_id>/redemptions/", AdminPromotionRedemptionsView.as_view()),

    # Reviews
    path("reviews/", AdminReviewListView.as_view()),
    path("reviews/<uuid:review_id>/", AdminReviewDetailView.as_view()),

    # Uploads
    path("upload/info/", AdminUploadInfoView.as_view()),
    path("upload/image/", AdminImageUploadView.as_view()),

    # Reports
    path("reports/sales/", AdminSalesReportView.as_view()),
    path("reports/sales/export/", AdminSalesReportExportView.as_view()),
    path("reports/inventory-valuation/", AdminInventoryValuationView.as_view()),
    path("reports/top-products/", AdminTopProductsView.as_view()),
    path("reports/top-suppliers/", AdminTopSuppliersView.as_view()),
    path("reports/vat-return/", AdminVatReturnView.as_view()),
    path("reports/vat-return/export/", AdminVatReturnExportView.as_view()),
    path("reports/promotions/", AdminPromotionsReportView.as_view()),
]
