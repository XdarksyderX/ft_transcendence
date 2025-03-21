from django.urls import path
from chat.api.views import MessageListView, mark_messages_as_read, RecentChatsView, unread_messages_indicator

urlpatterns = [
    path("messages/<str:other_username>/", MessageListView.as_view(), name="message-list"),
    path("messages/read/<str:other_username>/", mark_messages_as_read, name="mark-messages-read"),
    path("recent-chats/", RecentChatsView.as_view(), name="recent-chats"),
    path("unread-messages/", unread_messages_indicator, name="unread-messages-indicator"),
]