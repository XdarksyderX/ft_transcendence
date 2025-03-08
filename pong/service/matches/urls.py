from django.urls import path
from .views import (
    MatchHistoryView,
    MatchDetailView,
    InProgressMatchesView,
    JoinMatchView,
    PendingInvitationIncomingListView,
	PendingInvitationOutgoingListView,
    PendingInvitationCreateView,
    PendingInvitationDetailView,
    PendingInvitationDenyView,
    PendingInvitationCancelView,
)

urlpatterns = [
    path('match/history', MatchHistoryView.as_view(), name='match-history'),
    path('match/detail/<str:game_key>', MatchDetailView.as_view(), name='match-detail'),
    path('match/join/<str:token>/', JoinMatchView.as_view(), name='join-match'),
    path('match/in-progress/', InProgressMatchesView.as_view(), name='in-progress-matches'),

    path('invitation/outgoing/list/', PendingInvitationOutgoingListView.as_view(), name='invitation-outgoing-list'),
	path('invitation/incoming/list/', PendingInvitationIncomingListView.as_view(), name='invitation-incoming-list'),
    path('invitation/create/', PendingInvitationCreateView.as_view(), name='invitation-create'),
    path('invitation/detail/<str:token>', PendingInvitationDetailView.as_view(), name='invitation-detail'),
    path('invitation/deny/<str:token>', PendingInvitationDenyView.as_view(), name='invitation-deny'),
    path('invitation/cancel/<str:token>', PendingInvitationCancelView.as_view(), name='invitation-cancel'),
]
