from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterUserSerializer, LoginSerializer, LogoutSerializer
from core.models import User, TwoFA
from django.utils.http import http_date
import datetime
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data
import pyotp


class RegisterUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "username": user.username,
                        "user_id": user.id
                    },
                    event_type="auth.user_registered",
                    aggregate_id=str(user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.user_registered', message=event_data)
            finally:
                rabbit_client.close()

            return Response({
                "status": "success",
                "message": "User registered successfully.",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            two_fa_code = serializer.validated_data.get('two_fa_code')  # Obtenemos el 2FA code si se proporciona
            user = authenticate(request, username=username, password=password)

            if user is not None:
                if not user.is_email_verified:
                    return Response({"status": "error", "message": "Email is not verified."}, status=status.HTTP_403_FORBIDDEN)

                # Verificar si el usuario tiene 2FA activado
                if user.two_fa_enabled:
                    if not two_fa_code:
                        return Response({"status": "error", "message": "2FA code is required."}, status=status.HTTP_401_UNAUTHORIZED)

                    # Verificar si el código 2FA es válido
                    two_fa_instance = TwoFA.objects.filter(user=user, is_active=True).first()
                    if not two_fa_instance or not pyotp.TOTP(two_fa_instance.secret).verify(two_fa_code):
                        return Response({"status": "error", "message": "Invalid 2FA code."}, status=status.HTTP_401_UNAUTHORIZED)

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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({"status": "error", "message": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            new_access_token = str(refresh.access_token)

            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "user_id": refresh.payload['user_id'], 
                        "username": User.objects.get(id=refresh.payload['user_id']).username
                    },
                    event_type="auth.token_refreshed",
                    aggregate_id=str(refresh.payload['user_id'])
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.token_refreshed', message=event_data)
            finally:
                rabbit_client.close()

            return Response({
                "status": "success",
                "access_token": new_access_token
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"status": "error", "message": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            refresh_token = serializer.validated_data['refresh_token']
            try:
                refresh = RefreshToken(refresh_token)
                refresh.blacklist()
                response = Response({"status": "success", "message": "Logged out successfully."}, status=status.HTTP_200_OK)
                response.delete_cookie('refresh_token')

                rabbit_client = RabbitMQClient()
                try:
                    event_data = wrap_event_data(
                        data={
                            "user_id": str(refresh.payload['user_id'])
                        },
                        event_type="auth.user_logged_out",
                        aggregate_id=str(refresh.payload['user_id'])
                    )
                    rabbit_client.publish(exchange='auth', routing_key='auth.user_logged_out', message=event_data)
                finally:
                    rabbit_client.close()

                return response
            except Exception as e:
                return Response({"status": "error", "message": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)