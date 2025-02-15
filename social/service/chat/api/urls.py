from django.urls import path, include

from .views import CreateMessageView, AllChatsView, ChatHistoryView

urlpatterns = [
    path('history/', include([
        path('all/', AllChatsView.as_view(), name='all_chats'),
        path('chat/<str:friend_username>/', ChatHistoryView.as_view(), name='chat_history'),
    ])),

    path('message/new/', CreateMessageView.as_view(), name='create_message'),
]