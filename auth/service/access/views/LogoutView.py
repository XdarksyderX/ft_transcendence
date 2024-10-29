from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data
from ..serializers import LogoutSerializer

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
            except:
                return Response({"status": "error", "message": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
