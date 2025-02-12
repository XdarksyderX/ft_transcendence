import uuid
import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import (ChangeUsernameSerializer, 
                          ChangeEmailSerializer, ResetPasswordRequestSerializer, 
                          ResetPasswordSerializer, 
                          ChangePasswordSerializer)
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from core.models import EmailVerification, User, PasswordReset
from django.utils import timezone
from core.utils.event_domain import publish_event
import secrets

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "message": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangeUsernameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({"status": "error", "message": "Username cannot be changed for users registered with OAuth."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ChangeUsernameSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            publish_event("auth", "auth.username_changed", {"user_id": user.id, "username": user.username})
            return Response({
                "status": "success",
                "message": "Username changed successfully."
            }, status=status.HTTP_200_OK)

        errors = serializer.errors
        field_name, field_errors = next(iter(errors.items()))
        error_message = field_errors[0] if isinstance(field_errors, list) else field_errors
        return Response({
            "status": "error",
            "message": error_message
        }, status=status.HTTP_400_BAD_REQUEST)

class ChangeEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({"status": "error", "message": "Email cannot be changed for users registered with OAuth."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ChangeEmailSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            serializer.save()

            verification_code = str(uuid.uuid4())[:6]
            expires_at = timezone.now() + datetime.timedelta(hours=1)
            EmailVerification.objects.update_or_create(user=user, defaults={"verification_code": verification_code, "expires_at": expires_at, "verified": False})

            verification_link = f"{settings.FRONTEND_URL}/verify-email/?token={verification_code}"
            send_mail(subject="Verify your new email address", message=f"Please verify your new email address by clicking on the following link: {verification_link}", from_email=settings.EMAIL_HOST_USER, recipient_list=[user.email], fail_silently=False)

            return Response({"status": "success", "message": "Email changed successfully. Please verify your new email."}, status=status.HTTP_200_OK)
        
        return Response({"status": "error", "message": serializer.errors.get('error', 'Invalid request.')}, status=status.HTTP_400_BAD_REQUEST)

def generate_reset_token(user):
    token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(hours=1)
    PasswordReset.objects.create(user=user, reset_token=token, expires_at=expires_at)
    return token

def validate_reset_token(token):
    try:
        reset_entry = PasswordReset.objects.get(reset_token=token)
    except PasswordReset.DoesNotExist:
        return None
    if reset_entry.expires_at < timezone.now():
        reset_entry.delete()
        return None
    user = reset_entry.user
    reset_entry.delete()
    return user

def send_reset_email(email, token):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_mail(
        subject="Password Reset Request",
        message=f"Please reset your password by clicking on the following link: {reset_link}",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )

class ResetPasswordRequestView(APIView):
    def post(self, request):
        serializer = ResetPasswordRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = User.objects.get(email=email)
                if user.oauth_registered:
                    return Response({
                        "status": "success",
                        "message": "If there is a registered account, an email will be sent with instructions to change the password."
                    }, status=status.HTTP_200_OK)
                reset_token = generate_reset_token(user)
                send_reset_email(user.email, reset_token)
            except User.DoesNotExist:
                pass
            return Response({
                "status": "success",
                "message": "If there is a registered account, an email will be sent with instructions to change the password."
            }, status=status.HTTP_200_OK)
        errors = serializer.errors
        field_name, field_errors = next(iter(errors.items()))
        error_message = field_errors[0] if isinstance(field_errors, list) else field_errors
        return Response({
            "status": "error",
            "message": error_message
        }, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            user = validate_reset_token(reset_token)
            if user is None:
                return Response({
                    "status": "error",
                    "message": "Invalid or expired reset token."
                }, status=status.HTTP_400_BAD_REQUEST)
            serializer.save(user)
            return Response({
                "status": "success",
                "message": "Password reset successfully."
            }, status=status.HTTP_200_OK)
        errors = serializer.errors
        field_name, field_errors = next(iter(errors.items()))
        error_message = field_errors[0] if isinstance(field_errors, list) else field_errors
        return Response({
            "status": "error",
            "message": error_message
        }, status=status.HTTP_400_BAD_REQUEST)
