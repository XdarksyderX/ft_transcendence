from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data

class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        response = Response(
            {"status": "success", "message": "Logged out successfully."},
            status=status.HTTP_200_OK
        )
        response.delete_cookie('refresh_token')
        response.delete_cookie('access_token')

        refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            try:
                refresh = RefreshToken(refresh_token)
                refresh.blacklist()

                rabbit_client = RabbitMQClient()
                try:
                    event_data = wrap_event_data(
                        data={"user_id": str(refresh.payload['user_id'])},
                        event_type="auth.user_logged_out",
                        aggregate_id=str(refresh.payload['user_id'])
                    )
                    rabbit_client.publish(exchange='auth', routing_key='auth.user_logged_out', message=event_data)
                finally:
                    rabbit_client.close()

            except Exception as e:
                print(f"Error during logout: {e}")

        return response