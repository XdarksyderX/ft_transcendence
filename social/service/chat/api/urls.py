from django.urls import path
from chat.api.views import MessageListView, mark_messages_as_read

urlpatterns = [
    path("messages/<int:receiver_id>/", MessageListView.as_view(), name="message-list"),
    path("messages/read/<int:sender_id>/", mark_messages_as_read, name="mark-messages-read"),
]
