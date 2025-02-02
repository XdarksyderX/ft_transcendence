from django.urls import re_path
from .views.FourtyTwoOAuthViews import FortyTwoOAuthView
from .views.FourtyTwoOAuthCallbackView import FortyTwoCallbackView
from .views.LoginView import LoginView
from .views.LogoutView import LogoutView
from .views.RefreshTokenView import RefreshTokenView
from .views.RegisterView import RegisterUserView
from .views.VerifyTokenView import VerifyTokenView
from .views.DeleteAccountView import DeleteAccountView

urlpatterns = [
    re_path(r'^register/?$', RegisterUserView.as_view(), name='register'),
    re_path(r'^login/?$', LoginView.as_view(), name='login'),
    re_path(r'^logout/?$', LogoutView.as_view(), name='logout'),
    re_path(r'^verify-token/?$', VerifyTokenView.as_view(), name='verify'),
    re_path(r'^refresh/?$', RefreshTokenView.as_view(), name='token_refresh'),
    re_path(r'^oauth/42/?$', FortyTwoOAuthView.as_view(), name='oauth_42'),
    re_path(r'^oauth/42/callback/?$', FortyTwoCallbackView.as_view(), name='oauth_42_callback'),
	re_path(r'^delete-account/?$', DeleteAccountView.as_view(), name='delete_account')
    
]
