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


urlpatterns = [
    path('all_messages/', include(router_chat.urls)), # TODO CREO QUE ES DE PRUEBA SE PUEDE BORRAR
    path('messages/<str:username>/<str:username2>/', UserMessagesView.as_view(), name='user-messages'),

    path('block_user/<str:username>/', BlockUserView.as_view(), name='block_user'),
    path('unblock_user/<str:username>/', UnblockUserView.as_view(), name='unblock_user'),
    path('is_blocked/<str:username>/', IsUserBlockedView.as_view(), name='is_blocked'),
    path('blocked_friends_list/', BlockedFriendListView.as_view(), name='blocked_friends_list'),

    path('friends_list/', FriendListView.as_view(), name='friends_list'),
    path('remove_friend/<str:username>/', RemoveFriendView.as_view(), name='remove_friend'),
    path('pending_received_requests/', PendingReceivedRequestsView.as_view(), name='pending_received_requests'),
    path('pending_sent_requests/', PendingSentRequestsView.as_view(), name='pending_sent_requests'),
    path('accept_friend_request/<str:username>/', AcceptFriendRequestView.as_view(), name='accept_friend_request'),
    path('decline_friend_request/<str:username>/', DeclineFriendRequestView.as_view(), name='decline_friend_request'),
    path('cancel_friend_request/<str:username>/', CancelFriendRequestView.as_view(), name='cancel_friend_request'),

    path('profile_view/', ProfileView.as_view(), name='profile'),
    path('search_users/<str:username>/', SearchUsersView.as_view(), name='search_users'),
]
