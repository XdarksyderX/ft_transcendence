from django.urls import path
from .views import QuickMatchStatisticsView, TournamentStatisticsView

urlpatterns = [
	path("stats/quick-match", QuickMatchStatisticsView.as_view(), name="quick-match"),
	path("stats/tournaments", TournamentStatisticsView.as_view(), name="leaderboard")
]
