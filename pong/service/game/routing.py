from django.urls import path
from .consumers import GameConsumer

websocket_urlpatterns = [
    path('ws/game/<str:game_key>/', GameConsumer.as_asgi())
]
