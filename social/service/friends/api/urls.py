
from django.urls import path, include
from .views.blocked import BlockUserView, UnblockUserView, IsUserBlockedView, BlockedListView
from .views.friends import FriendsListView, RemoveFriendView
from .views.profile import ProfileView, SearchUsersView, ChangeAvatarView, UpdateOnlineStatusView
from .views.requests import (PendingReceivedRequestsView, PendingSentRequestsView,
							AcceptRequestView, DeclineRequestView, CancelRequestView, SendRequestView)

urlpatterns = [
    path('friends/', include([
        path('list/', FriendsListView.as_view(), name='friends_list'),
        path('remove/<str:friend_username>/', RemoveFriendView.as_view(), name='remove_friend'),
    ])),
    
    path('requests/', include([
		path('send/<str:friend_username>/', SendRequestView.as_view(), name='send_friend_request'),
        path('pending/received/', PendingReceivedRequestsView.as_view(), name='pending_received_requests'),
        path('pending/sent/', PendingSentRequestsView.as_view(), name='pending_sent_requests'),
        path('accept/<int:invitation_id>/', AcceptRequestView.as_view(), name='accept_friend_request'),
        path('decline/<int:invitation_id>/', DeclineRequestView.as_view(), name='decline_friend_request'),
        path('cancel/<int:invitation_id>/', CancelRequestView.as_view(), name='cancel_friend_request'),
    ])),

    path('block/', include([
        path('user/<str:target_username>/', BlockUserView.as_view(), name='block_user'),
        path('unblock/<str:target_username>/', UnblockUserView.as_view(), name='unblock_user'),
        path('is-blocked/<str:target_username>/', IsUserBlockedView.as_view(), name='is_blocked'),
        path('list/', BlockedListView.as_view(), name='blocked_friends_list'),
    ])),

	path('online-status/', UpdateOnlineStatusView.as_view(), name='update_status'),
    path('profile/', ProfileView.as_view(), name='profile'),
	path('change-avatar', ChangeAvatarView.as_view(), name='change_avatar'),
    path('profile/<str:username>/', ProfileView.as_view(), name='user_profile'),
    path('search/<str:username>/', SearchUsersView.as_view(), name='search_users'),
]
