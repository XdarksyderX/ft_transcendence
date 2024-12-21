from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
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
                        "username": refresh.payload.get('username')
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
