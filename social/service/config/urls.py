from django.urls import path, include

urlpatterns = [
    path('', include('friends.api.urls')),
    #path('', include('chat.api.urls')),
]
