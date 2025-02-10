from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..serializers import DeleteAccountSerializer
from django.contrib.auth import get_user_model
from core.utils.event_domain import wrap_event_data
from core.utils.rabbitmq_client import RabbitMQClient
User = get_user_model()

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DeleteAccountSerializer

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            try:
                user = request.user
                user.delete()
                rabbit_client = RabbitMQClient()
                try:
                    event_data = {
                        "user_id": user.id
                    }
                    rabbit_client.publish(
                        exchange='auth',
                        routing_key='auth.user_deleted',
                        message=wrap_event_data(event_data, 'auth.user_deleted', str(user.id)), 
                    )
                finally:
                    rabbit_client.close()
                return Response(
                    {"status": "sucess", "message": "Account deleted successfully"},
                    status=status.HTTP_204_NO_CONTENT
                )
            except Exception as e:
                return Response(
                    {"status":"error", "message": "Failed to delete account"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )