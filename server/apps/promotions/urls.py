from django.urls import path

from apps.promotions.views import TrackPromoClickView, ValidatePromoCodeView

urlpatterns = [
    path("promotions/validate/", ValidatePromoCodeView.as_view()),
    path("promotions/track-click/", TrackPromoClickView.as_view()),
]
