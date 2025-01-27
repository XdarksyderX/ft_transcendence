"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

from chat.api.router import router_chat
from chat.api.views import UserMessagesView, UsersListsView
from social.api.views.blocked import BlockUserView, UnblockUserView, IsUserBlockedView
from social.api.views.friends import FriendListView, BlockedFriendListView, RemoveFriendView, PendingReceivedRequestsView, PendingSentRequestsView, AcceptFriendRequestView, DeclineFriendRequestView, CancelFriendRequestView
from social.api.views.profile import ProfileView, SearchUsersView


urlpatterns = [
    path('all_messages/', include(router_chat.urls)), # TODO CREO QUE ES DE PRUEBA SE PUEDE BORRAR
    path('messages/<str:username>/<str:username2>/', UserMessagesView.as_view(), name='user-messages'),

    # Social
    path('api/social/block_user/<str:username>/', BlockUserView.as_view(), name='block_user'),
    path('api/social/unblock_user/<str:username>/', UnblockUserView.as_view(), name='unblock_user'),
    path('api/is_blocked/<str:username>/', IsUserBlockedView.as_view(), name='is_blocked'),
    path('api/social/blocked_friends_list/', BlockedFriendListView.as_view(), name='blocked_friends_list'),

    path('api/social/friends_list/', FriendListView.as_view(), name='friends_list'),
    path('api/social/remove_friend/<str:username>/', RemoveFriendView.as_view(), name='remove_friend'),
    path('api/social/pending_received_requests/', PendingReceivedRequestsView.as_view(), name='pending_received_requests'),
    path('api/social/pending_sent_requests/', PendingSentRequestsView.as_view(), name='pending_sent_requests'),
    path('api/social/accept_friend_request/<str:username>/', AcceptFriendRequestView.as_view(), name='accept_friend_request'),
    path('api/social/decline_friend_request/<str:username>/', DeclineFriendRequestView.as_view(), name='decline_friend_request'),
    path('api/social/cancel_friend_request/<str:username>/', CancelFriendRequestView.as_view(), name='cancel_friend_request'),

    path('api/social/profile_view/', ProfileView.as_view(), name='profile'),
    path('api/social/search_users/<str:username>/', SearchUsersView.as_view(), name='search_users'),
]
