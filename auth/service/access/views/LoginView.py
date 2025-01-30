import datetime
import pyotp
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.core.signing import Signer, BadSignature
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.http import http_date
from django.contrib.auth import authenticate
from core.models import User, TwoFA
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data
from ..serializers import LoginSerializer

signer = Signer()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            user = authenticate(request, username=username, password=password)
            if not user:
                return Response({"status": "error", "message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

            if not user.is_email_verified:
                return Response({"status": "error", "message": "Email is not verified."}, status=status.HTTP_403_FORBIDDEN)

            if user.two_fa_enabled:
                temp_token = signer.sign(user.id)
                return Response({
                    "status": "error",
                    "message": "OTP required.",
                    "temp_token": temp_token
                }, status=status.HTTP_202_ACCEPTED)

            refresh = RefreshToken.for_user(user)
            refresh["user_id"] = user.id
            refresh["username"] = user.username
            refresh["two_fa_enabled"] = user.two_fa_enabled

            response = Response({
                "status": "success",
                "access_token": str(refresh.access_token)
            }, status=status.HTTP_200_OK)

            expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                expires=http_date(expiration.timestamp()),
                samesite='Strict'
            )

            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={"username": user.username, "email": user.email},
                    event_type="auth.user_logged_in",
                    aggregate_id=str(user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.user_logged_in', message=event_data)
            finally:
                rabbit_client.close()

            return response

        return Response({"status": "error", "message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
