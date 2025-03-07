# urls.py
from django.urls import path
from .views import (
    TournamentCreateView,
    TournamentDetail,
    TournamentInvitationCreateView,
    TournamentInvitationAcceptView,
    TournamentInvitationDenyView,
    TournamentInvitationCancelView,
    TournamentDeletePlayerView,
    TournamentDeleteView,
	TournamentListView,
)

urlpatterns = [
    path('tournaments/', TournamentCreateView.as_view(), name='create_tournament'),
	path('tournaments/list/', TournamentListView.as_view(), name='list_tournaments'),
    path('tournaments/<str:token>/', TournamentDetail.as_view(), name='tournament_detail'),

    path(
        'tournaments/<str:tournament_token>/invite/<str:receiver_username>/',
        TournamentInvitationCreateView.as_view(),
        name='tournament_invitation_create'
    ),

    path(
        'tournaments/invitations/<str:invitation_token>/accept/',
        TournamentInvitationAcceptView.as_view(),
        name='tournament_invitation_accept'
    ),

    path(
        'tournaments/invitations/<str:invitation_token>/deny/',
        TournamentInvitationDenyView.as_view(),
        name='tournament_invitation_deny'
    ),

    path(
        'tournaments/invitations/<str:invitation_token>/cancel/',
        TournamentInvitationCancelView.as_view(),
        name='tournament_invitation_cancel'
    ),

    path(
        'tournaments/<str:token>/players/<str:username>/delete/',
        TournamentDeletePlayerView.as_view(),
        name='tournament_delete_player'
    ),
    
    path(
        'tournaments/<str:token>/delete/',
        TournamentDeleteView.as_view(),
        name='tournament_delete'
    ),
]
