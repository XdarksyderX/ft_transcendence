import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.http import http_date
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data
from ..serializers import VerifyOTPSerializer

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

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
        print(serializer.errors)
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
