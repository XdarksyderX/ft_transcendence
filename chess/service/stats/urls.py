from django.urls import path
from .views import RankedChessStatsView, CasualChessStatsView

urlpatterns = [
    path('stats/ranked/', RankedChessStatsView.as_view(), name='ranked-chess-stats'),
    path('stats/casual/', CasualChessStatsView.as_view(), name='casual-chess-stats'),
]