from django.urls import path

from .views import TrackView

urlpatterns = [
    path("analytics/track/", TrackView.as_view()),
]
