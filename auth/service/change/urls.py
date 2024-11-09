from django.urls import path
from .views import ChangeUsernameView, ChangeEmailView, ResetPasswordRequestView, ResetPasswordView

urlpatterns = [
    path('change-username/', ChangeUsernameView.as_view(), name='change_username'),
    path('change-email/', ChangeEmailView.as_view(), name='change_email'),
    path('reset-password-request/', ResetPasswordRequestView.as_view(), name='reset_password_request'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]