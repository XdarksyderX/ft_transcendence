from django.urls import path
from .consumers import GameConsumer

websocket_urlpatterns = [
    path('ws/game/<str:room_name>/', GameConsumer.as_asgi()),  # WebSocket route with room name, not sure if correct
]
