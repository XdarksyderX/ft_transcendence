from django.urls import path
from core.views import ProtectedMediaView

urlpatterns = [
    path('avatars/<path:path>', ProtectedMediaView.as_view(), name='protected_media'),
]
