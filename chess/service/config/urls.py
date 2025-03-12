from django.urls import path, include

urlpatterns = [
    path('', include('matches.urls')),
    path('matchmaking/', include('matchmaking.urls'))
]
