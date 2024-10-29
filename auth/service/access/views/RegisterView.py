import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data
from ..serializers import RegisterUserSerializer

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
            
        print(serializer.errors)
        if (not 'required' in str(serializer.errors)):
            return Response({"status": "error", "message": "This email or username is already registered."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "error", "message": "Required email, username and password"}, status=status.HTTP_400_BAD_REQUEST)