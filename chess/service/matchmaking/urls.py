from django.urls import path
from .views import (
    JoinMatchmakingView,
    LeaveMatchmakingView,
    CheckMatchmakingStatusView,
)

urlpatterns = [
    path('matchmaking/join/', JoinMatchmakingView.as_view(), name='join-matchmaking'),
    path('matchmaking/leave/', LeaveMatchmakingView.as_view(), name='leave-matchmaking'),
    path('matchmaking/status/', CheckMatchmakingStatusView.as_view(), name='check-matchmaking-status'),
]
