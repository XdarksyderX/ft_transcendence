from django.urls import re_path
from .views import (
    ChangeUsernameView,
    ChangeEmailView,
    ResetPasswordRequestView,
    ResetPasswordView,
    ChangePasswordView
)

urlpatterns = [
    re_path(r'^change-username/?$', ChangeUsernameView.as_view(), name='change_username'),
	re_path(r'^change-password/?$', ChangePasswordView.as_view(), name='change_password'),
    re_path(r'^change-email/?$', ChangeEmailView.as_view(), name='change_email'),
    re_path(r'^reset-password-request/?$', ResetPasswordRequestView.as_view(), name='reset_password_request'),
    re_path(r'^reset-password/?$', ResetPasswordView.as_view(), name='reset_password'),
]

handler404 = 'service.core.exceptions.global_handler.page_not_found'