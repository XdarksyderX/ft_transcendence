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
from social.api.views.profile import ProfileView
from social.api.views.friends import FriendListView
from social.api.views.blocked import BlockUserView, UnblockUserView
from social.api.views.pending_friends import AcceptFriendRequestView, DenyFriendRequestView, SendFriendRequestView

urlpatterns = [
    path('all_messages/', include(router_chat.urls)), # TODO CREO QUE ES DE PRUEBA SE PUEDE BORRAR
    path('messages/<str:username>/<str:username2>/', UserMessagesView.as_view(), name='user-messages'),
    path('user_list/<str:username>/', UsersListsView.as_view(), name='user-lists'),
    path('profile_view/<str:username>/', ProfileView.as_view(), name='profile'),
    path('friends_list/<int:user_id>/', FriendListView.as_view(), name='friends_list'),
#     path('friends/pending/<int:user_id>/', PendingFriendListView.as_view(), name='pending_friends_list'),
#     path('friends/list/<int:user_id>/', BlockedFriendListView.as_view(), name='blocked_friends_list'),
    path('api/user/<int:user_id>/block/<int:block_user_id>/', BlockUserView.as_view(), name='block_user'),
    path('api/user/<int:user_id>/unblock/<int:unblock_user_id>/', UnblockUserView.as_view(), name='unblock_user'),
    path('api/user/<int:user_id>/accept/<int:friend_id>/', AcceptFriendRequestView.as_view(), name='accept_friend'),
    path('api/user/<int:user_id>/deny/<int:friend_id>/', DenyFriendRequestView.as_view(), name='deny_friend'),
    path('api/user/<int:user_id>/send_request/<int:friend_id>/', SendFriendRequestView.as_view(), name='send_friend_request'),
]
