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

            if user is not None:
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
                response = Response({
                    "status": "success",
                    "access_token": str(refresh.access_token),
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
                        data={
                            "username": user.username,
                            "email": user.email
                        },
                        event_type="auth.user_logged_in",
                        aggregate_id=str(user.id)
                    )
                    rabbit_client.publish(exchange='auth', routing_key='auth.user_logged_in', message=event_data)
                finally:
                    rabbit_client.close()

                return response
            return Response({"status": "error", "message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({"status": "error", "message": "Required username and password"}, status=status.HTTP_400_BAD_REQUEST)

    def verify_otp(self, request):
        temp_token = request.data.get('temp_token')
        two_fa_code = request.data.get('two_fa_code')

        if not temp_token or not two_fa_code:
            return Response({
                "status": "error",
                "message": "Temp token and 2FA code are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = signer.unsign(temp_token)
            user = User.objects.get(id=user_id)
        except (BadSignature, User.DoesNotExist):
            return Response({
                "status": "error",
                "message": "Invalid or expired temp token."
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            two_fa_instance = user.two_fa
            if not pyotp.TOTP(two_fa_instance.secret).verify(two_fa_code):
                return Response({
                    "status": "error",
                    "message": "Invalid 2FA code."
                }, status=status.HTTP_401_UNAUTHORIZED)
        except TwoFA.DoesNotExist:
            return Response({
                "status": "error",
                "message": "2FA configuration not found."
            }, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        response = Response({
            "status": "success",
            "access_token": str(refresh.access_token),
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
                data={
                    "username": user.username,
                    "email": user.email
                },
                event_type="auth.user_logged_in_2fa",
                aggregate_id=str(user.id)
            )
            rabbit_client.publish(exchange='auth', routing_key='auth.user_logged_in_2fa', message=event_data)
        finally:
            rabbit_client.close()

        return response
