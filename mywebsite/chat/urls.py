from django.urls import path
from .views import home, room

urlpatterns = [
    path('', home, name = 'home'),
    path('room/<int:room_id>/', room, name = 'room'),
]