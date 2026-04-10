from django.urls import path

from apps.promotions.views import ValidatePromoCodeView

urlpatterns = [
    path("promotions/validate/", ValidatePromoCodeView.as_view()),
]
