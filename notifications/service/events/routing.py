from django.urls import path
from .consumers import NotificationConsumer

websocket_urlpatterns = [
    path('ws/events/', NotificationConsumer.as_asgi())
]