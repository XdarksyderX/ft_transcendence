from django.urls import path
from .views import (MatchHistoryView, PendingInvitationCreateView,
				   PendingInvitationDetailView, 
				   PendingInvitationListView, JoinMatchView, PendingMatchesView)

urlpatterns = [
    path('history/', MatchHistoryView.as_view(), name='match-history'),
    path('invitations/', PendingInvitationListView.as_view(), name='match-invitations'),
    path('invitations/create/', PendingInvitationCreateView.as_view(), name='match-invitation-create'),
    path('invitations/<int:invitation_id>/', PendingInvitationDetailView.as_view(), name='match-invitation-detail'),
    path('join/<str:token>/', JoinMatchView.as_view(), name='join-match'),
    path('pending/', PendingMatchesView.as_view(), name='pending-matches'),
]
