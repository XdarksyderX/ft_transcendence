from django.urls import path
from .views import (
    ChessStatsView,
)

urlpatterns = [
    path('stats/', ChessStatsView.as_view(), name='chess-stats'),
]
