from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import VerifyEmailSerializer
from core.models import TwoFA
from core.utils.event_domain import publish_event
import pyotp

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = VerifyEmailSerializer(data=request.query_params)
        if serializer.is_valid():
            user = serializer.save()
            publish_event("auth", "auth.email_verified", {"user_id": user.id, "username": user.username})

            return Response({
                "status": "success",
                "message": "Email verified successfully."
            }, status=status.HTTP_200_OK)
        
        return Response({"status": "error", "message": serializer.errors.get('error', 'Invalid request.')}, status=status.HTTP_400_BAD_REQUEST)

class Activate2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({
                "status": "error",
                "message": "2FA cannot be activated or deactivated for users registered with OAuth."
            }, status=status.HTTP_403_FORBIDDEN)

        password = request.data.get("password")
        if not password:
            return Response({"status": "error", "message": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(password):
            return Response({"status": "error", "message": "Invalid password."}, status=status.HTTP_401_UNAUTHORIZED)

        user = request.user
        if user.two_fa_enabled:
            return Response({"status": "error", "message": "2FA is already activated."}, status=status.HTTP_400_BAD_REQUEST)

        secret = pyotp.random_base32()
        user.two_fa = TwoFA.objects.create(secret=secret)
        user.two_fa_enabled = True
        user.save()
        publish_event("auth", "auth.2fa_enabled", {"user_id": user.id, "username": user.username})

        return Response({"status": "success", "message": "2FA enabled successfully.", "secret": secret}, status=status.HTTP_200_OK)


class Deactivate2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.oauth_registered:
            return Response({
                "status": "error",
                "message": "2FA cannot be activated or deactivated for users registered with OAuth."
            }, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        password = request.data.get("password")
        two_fa_code = request.data.get("two_fa_code")

        if not password or not two_fa_code:
            return Response({"status": "error", "message": "Password and OTP code are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"status": "error", "message": "Invalid password."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            two_fa_instance = user.two_fa
            if not pyotp.TOTP(two_fa_instance.secret).verify(two_fa_code):
                return Response({"status": "error", "message": "Invalid 2FA code."}, status=status.HTTP_401_UNAUTHORIZED)
        except TwoFA.DoesNotExist:
            return Response({"status": "error", "message": "2FA configuration not found."}, status=status.HTTP_400_BAD_REQUEST)

        user.two_fa.delete()
        user.two_fa = None
        user.two_fa_enabled = False
        user.save()
        publish_event("auth", "auth.2fa_disabled", {"user_id": user.id, "username": user.username})

        return Response({"status": "success", "message": "2FA disabled successfully."}, status=status.HTTP_200_OK)