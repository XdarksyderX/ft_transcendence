from django.urls import path
from .views import GetProfilePicture

urlpatterns = [
    path('media/avatars/<str:file>', GetProfilePicture.as_view(), name='get_profile_picture'),
]