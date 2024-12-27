from django.urls import path
from . import views

urlpatterns = [
    path('history/<int:user_id>/', views.MatchHistoryView.as_view(), name='match-history'),
    path('invitations/', views.MatchInvitationView.as_view(), name='match-invitations'),
    path('invitations/<int:user_id>/', views.UserInvitationsView.as_view(), name='user-invitations'),
    path('invitations/<int:invitation_id>/', views.MatchInvitationDetailView.as_view(), name='match-invitation-detail'),
    path('join/', views.JoinMatchView.as_view(), name='join-match'),
    path('pending/<int:user_id>/', views.PendingMatchesView.as_view(), name='pending-matches'),
]
