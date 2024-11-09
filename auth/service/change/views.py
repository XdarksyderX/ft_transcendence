import uuid
import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import ChangeUsernameSerializer, ChangeEmailSerializer, ResetPasswordRequestSerializer, ResetPasswordSerializer
from django.core.mail import send_mail
from django.conf import settings
from core.models import EmailVerification, User
from django.utils import timezone
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data

class ChangeUsernameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({
                "status": "error",
                "message": "Username cannot be changed for users registered with OAuth."
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ChangeUsernameSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "user_id": user.id,
                        "username": user.username
                    },
                    event_type="auth.username_changed",
                    aggregate_id=str(user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.username_changed', message=event_data)
            finally:
                rabbit_client.close()

            return Response({
                "status": "success",
                "message": "Username changed successfully."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangeEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({
                "status": "error",
                "message": "Email cannot be changed for users registered with OAuth."
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ChangeEmailSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            serializer.save(user)

            verification_code = str(uuid.uuid4())[:6]
            expires_at = timezone.now() + datetime.timedelta(hours=1)
            EmailVerification.objects.update_or_create(user=user, defaults={
                "verification_code": verification_code,
                "expires_at": expires_at,
                "verified": False
            })

            verification_link = f"{settings.FRONTEND_URL}/verify-email/?token={verification_code}"
            send_mail(
                subject="Verify your new email address",
                message=f"Please verify your new email address by clicking on the following link: {verification_link}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "user_id": user.id,
                        "new_email": user.email
                    },
                    event_type="auth.email_changed",
                    aggregate_id=str(user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.email_changed', message=event_data)
            finally:
                rabbit_client.close()

            return Response({
                "status": "success",
                "message": "Email changed successfully. Please verify your new email."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({
                "status": "error",
                "message": "Password cannot be reset for users registered with OAuth."
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ResetPasswordRequestSerializer(data=request.data)
        if serializer.is_valid():
            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "user_id": request.user.id,
                        "email": request.user.email
                    },
                    event_type="auth.password_reset_requested",
                    aggregate_id=str(request.user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.password_reset_requested', message=event_data)
            finally:
                rabbit_client.close()

            return Response({
                "status": "success",
                "message": "Password reset email sent."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({
                "status": "error",
                "message": "Password cannot be reset for users registered with OAuth."
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "user_id": request.user.id
                    },
                    event_type="auth.password_reset",
                    aggregate_id=str(request.user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.password_reset', message=event_data)
            finally:
                rabbit_client.close()

            return Response({
                "status": "success",
                "message": "Password reset successfully."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
