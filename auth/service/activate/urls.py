from django.urls import re_path
from .views import VerifyEmailView, Activate2FAView

urlpatterns = [
    re_path(r'^verify-email/?$', VerifyEmailView.as_view(), name='verify_email'),
    re_path(r'^activate-2fa/?$', Activate2FAView.as_view(), name='activate_2fa'),
]
