# urls.py
from django.urls import path
from .views.management import (
    TournamentCreateView,
    TournamentDetail,
    TournamentInvitationCreateView,
	TournamentInvitationDetailView,
    TournamentInvitationAcceptView,
    TournamentInvitationDenyView,
    TournamentInvitationCancelView,
    TournamentDeletePlayerView,
    TournamentDeleteView,
	TournamentListView,
	TournamentEditableListView,
    TournamentStartView
)

from .views.matchmaking import (
    TournamentJoinQueue,
    TournamentLeaveQueue
)

urlpatterns = [
    path('tournaments/', TournamentCreateView.as_view(), name='create_tournament'),
	path('tournaments/list/', TournamentListView.as_view(), name='list_tournaments'),
	path('tournaments/editable/list/', TournamentEditableListView.as_view(), name='list_editable_tournaments'),
    path('tournaments/<str:token>/', TournamentDetail.as_view(), name='tournament_detail'),

    path(
        'tournaments/<str:tournament_token>/invite/<str:receiver_username>/',
        TournamentInvitationCreateView.as_view(),
        name='tournament_invitation_create'
    ),
	
    path(
        'tournaments/invitations/<str:invitation_token>/',
        TournamentInvitationDetailView.as_view(),
        name='tournament_invitation_detail'
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

    path(
        'tournaments/<str:tournament_token>/start/',
        TournamentStartView.as_view(),
        name='start_tournament'),

    path('tournaments/<uuid:tournament_token>/queue/join/', 
         TournamentJoinQueue.as_view(), 
         name='tournament_join_queue'),
    
    path('tournaments/<uuid:tournament_token>/queue/leave/', 
         TournamentLeaveQueue.as_view(), 
         name='tournament_leave_queue'),
]
