from django.urls import re_path
from .views import VerifyEmailView, Activate2FAView, Deactivate2FAView

urlpatterns = [
    re_path(r'^verify-email/?$', VerifyEmailView.as_view(), name='verify_email'),
    re_path(r'^activate-2fa/?$', Activate2FAView.as_view(), name='activate_2fa'),
	re_path(r'^deactivate-2fa/?$', Deactivate2FAView.as_view(), name='deactivate_2fa')
]
