from django.urls import path
from .views import RouteAnalysisView, health
urlpatterns = [
    path("health/", health),
    path("route-analysis/", RouteAnalysisView.as_view()),
]
