from django.urls import path
from .views.FourtyTwoOAuthViews import FortyTwoOAuthView
from .views.FourtyTwoOAuthCallbackView import FortyTwoCallbackView
from .views.LoginView import LoginView
from .views.LogoutView import LogoutView
from .views.RefreshTokenView import RefreshTokenView
from .views.RegisterView import RegisterUserView
from .views.VerifyOTPView import VerifyOTPView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('oauth/42/', FortyTwoOAuthView.as_view(), name='oauth_42'),
    path('oauth/42/callback/', FortyTwoCallbackView.as_view(), name='oauth_42_callback'),
]
