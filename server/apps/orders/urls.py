from django.urls import path

from apps.orders.views import (
    CreateCheckoutSessionView,
    OrderBySessionView,
    OrderDetailView,
    OrderHistoryView,
    StripeWebhookView,
)

urlpatterns = [
    path("orders/checkout/", CreateCheckoutSessionView.as_view()),
    path("orders/webhook/stripe/", StripeWebhookView.as_view()),
    path("orders/by-session/<str:session_id>/", OrderBySessionView.as_view()),
    path("orders/", OrderHistoryView.as_view()),
    path("orders/<str:order_number>/", OrderDetailView.as_view()),
]
