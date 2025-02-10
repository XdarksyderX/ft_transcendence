
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views.blocked import BlockUserView, UnblockUserView, IsUserBlockedView
from .views.friends import FriendsListView, BlockedListView, RemoveFriendView, PendingReceivedRequestsView, PendingSentRequestsView, AcceptRequestView, DeclineRequestView, CancelRequestView
from .views.profile import ProfileView, SearchUsersView, ChangeAvatarView

urlpatterns = [
    path('friends/', include([
        path('list/', FriendsListView.as_view(), name='friends_list'),
        path('remove/<str:username>/', RemoveFriendView.as_view(), name='remove_friend'),
    ])),
    
    path('requests/', include([
        path('pending/received/', PendingReceivedRequestsView.as_view(), name='pending_received_requests'),
        path('pending/sent/', PendingSentRequestsView.as_view(), name='pending_sent_requests'),
        path('accept/<int:invitation_id>/', AcceptRequestView.as_view(), name='accept_friend_request'),
        path('decline/<int:invitation_id>/', DeclineRequestView.as_view(), name='decline_friend_request'),
        path('cancel/<int:invitation_id>/', CancelRequestView.as_view(), name='cancel_friend_request'),
    ])),

    path('block/', include([
        path('user/<str:username>/', BlockUserView.as_view(), name='block_user'),
        path('unblock/<str:username>/', UnblockUserView.as_view(), name='unblock_user'),
        path('is-blocked/<str:username>/', IsUserBlockedView.as_view(), name='is_blocked'),
        path('list/', BlockedListView.as_view(), name='blocked_friends_list'),
    ])),

    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/<str:username>/', ProfileView.as_view(), name='user_profile'),
	path('profile/avatar/', ChangeAvatarView.as_view(), name='change_avatar'),
    path('search/<str:username>/', SearchUsersView.as_view(), name='search_users'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
