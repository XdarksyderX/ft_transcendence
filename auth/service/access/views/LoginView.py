import datetime
import pyotp
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.http import http_date
from django.contrib.auth import authenticate
from datetime import datetime, timezone, timedelta
from core.models import TwoFA
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        two_fa_code = request.data.get('two_fa_code', None)
        if not username or not password:
            return Response(
                {"status": "error", "message": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {"status": "error", "message": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_email_verified:
            return Response(
                {"status": "error", "message": "Email is not verified."},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.two_fa_enabled:
            if not two_fa_code:
                return Response(
                    {"status": "error", "message": "OTP required."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            try:
                two_fa_instance = user.two_fa
                if not pyotp.TOTP(two_fa_instance.secret).verify(two_fa_code):
                    return Response(
                        {"status": "error", "message": "Invalid 2FA code."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except TwoFA.DoesNotExist:
                return Response(
                    {"status": "error", "message": "2FA configuration not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        refresh = RefreshToken.for_user(user)
        refresh["user_id"] = user.id
        refresh["username"] = user.username
        refresh["two_fa_enabled"] = user.two_fa_enabled
        access_token = str(refresh.access_token)

        response = Response(
            {"status": "success", "access_token": access_token},
            status=status.HTTP_200_OK
        )

        expiration = datetime.now(timezone.utc) + timedelta(days=7)
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            httponly=True,
            expires=http_date(expiration.timestamp()),
            samesite='Strict'
        )

        rabbit_client = RabbitMQClient()
        try:
            event_type = "auth.user_logged_in_2fa" if user.two_fa_enabled else "auth.user_logged_in"
            event_data = wrap_event_data(
                data={
                    "username": user.username,
                    "email": user.email
                },
                event_type=event_type,
                aggregate_id=str(user.id)
            )
            rabbit_client.publish(
                exchange='auth',
                routing_key=event_type,
                message=event_data
            )
        finally:
            rabbit_client.close()

        return response
