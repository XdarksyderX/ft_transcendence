from django.urls import path
from .views import VerifyEmailView, Activate2FAView

urlpatterns = [
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('activate-2fa/', Activate2FAView.as_view(), name='activate_2fa'),
]