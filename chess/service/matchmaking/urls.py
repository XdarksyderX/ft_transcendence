from django.urls import path
from .views import (
    JoinMatchmakingView,
    LeaveMatchmakingView,
    CheckMatchmakingStatusView,
)

urlpatterns = [
    path('join/', JoinMatchmakingView.as_view(), name='join-matchmaking'),
    path('leave/', LeaveMatchmakingView.as_view(), name='leave-matchmaking'),
    path('status/', CheckMatchmakingStatusView.as_view(), name='check-matchmaking-status'),
]
