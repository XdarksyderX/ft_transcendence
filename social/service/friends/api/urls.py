
from django.urls import path, include

from .views.blocked import BlockUserView, UnblockUserView, IsUserBlockedView
from .views.friends import FriendListView, BlockedFriendListView, RemoveFriendView, PendingReceivedRequestsView, PendingSentRequestsView, AcceptFriendRequestView, DeclineFriendRequestView, CancelFriendRequestView
from .views.profile import ProfileView, SearchUsersView

urlpatterns = [
    path('friends/', include([
        path('list/', FriendListView.as_view(), name='friends_list'),
        path('remove/<str:username>/', RemoveFriendView.as_view(), name='remove_friend'),
    ])),
    
    path('requests/', include([
        path('pending/received/', PendingReceivedRequestsView.as_view(), name='pending_received_requests'),
        path('pending/sent/', PendingSentRequestsView.as_view(), name='pending_sent_requests'),
        path('accept/<str:username>/', AcceptFriendRequestView.as_view(), name='accept_friend_request'),
        path('decline/<str:username>/', DeclineFriendRequestView.as_view(), name='decline_friend_request'),
        path('cancel/<str:username>/', CancelFriendRequestView.as_view(), name='cancel_friend_request'),
    ])),

    path('block/', include([
        path('user/<str:username>/', BlockUserView.as_view(), name='block_user'),
        path('unblock/<str:username>/', UnblockUserView.as_view(), name='unblock_user'),
        path('is-blocked/<str:username>/', IsUserBlockedView.as_view(), name='is_blocked'),
        path('list/', BlockedFriendListView.as_view(), name='blocked_friends_list'),
    ])),

    path('profile/', ProfileView.as_view(), name='profile'),
    path('search/<str:username>/', SearchUsersView.as_view(), name='search_users'),
]
