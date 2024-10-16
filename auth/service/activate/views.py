from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import VerifyEmailSerializer, Activate2FASerializer
from core.models import User, TwoFA
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data
import pyotp

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = VerifyEmailSerializer(data=request.query_params)
        if serializer.is_valid():
            user = serializer.save()

            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "user_id": user.id,
                        "username": user.username
                    },
                    event_type="auth.email_verified",
                    aggregate_id=str(user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key='auth.email_verified', message=event_data)
            finally:
                rabbit_client.close()

            return Response({
                "status": "success",
                "message": "Email verified successfully."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class Activate2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = Activate2FASerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            enable_2fa = serializer.validated_data['enable']
            user = request.user

            two_fa_instance, created = TwoFA.objects.get_or_create(user=user)

            if enable_2fa:
                if two_fa_instance.is_active:
                    return Response({
                        "status": "error",
                        "message": "2FA is already activated."
                    }, status=status.HTTP_400_BAD_REQUEST)

                secret = pyotp.random_base32()
                TwoFA.objects.update_or_create(user=user, defaults={"secret": secret, "is_active": True})

            else:
                if not two_fa_instance.is_active:
                    return Response({
                        "status": "error",
                        "message": "2FA is already deactivated."
                    }, status=status.HTTP_400_BAD_REQUEST)

                TwoFA.objects.filter(user=user).update(is_active=False)

            user.two_fa_enabled = enable_2fa
            user.save()

            rabbit_client = RabbitMQClient()
            try:
                event_type = "auth.2fa_enabled" if enable_2fa else "auth.2fa_disabled"
                event_data = wrap_event_data(
                    data={
                        "user_id": user.id,
                        "username": user.username,
                    },
                    event_type=event_type,
                    aggregate_id=str(user.id)
                )
                rabbit_client.publish(exchange='auth', routing_key=event_type, message=event_data)
            finally:
                rabbit_client.close()

            response_data = {
                "status": "success",
                "message": "2FA {} successfully.".format("enabled" if enable_2fa else "disabled")
            }

            if enable_2fa:
                response_data["secret"] = secret

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
