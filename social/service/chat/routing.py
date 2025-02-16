from django.urls import path
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/chat/<str:receiver_id>/", ChatConsumer.as_asgi()),
]
