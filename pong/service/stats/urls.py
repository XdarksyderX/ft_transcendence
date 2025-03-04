from django.urls import path
from .views import QuickMatchStatisticsView
# , TournamentsStatisticsView

urlpatterns = [
	path("/stats/quick-match", QuickMatchStatisticsView.as_view(), name="quick-match"),
	# path("/stats/tournaments", TournamentsStatisticsView.as_view(), name="leaderboard")
]
