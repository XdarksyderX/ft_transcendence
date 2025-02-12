import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import publish_event
from ..serializers import RegisterUserSerializer

class RegisterUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            publish_event("auth", "auth.user_registered", {"user_id": user.id, "username": user.username})
            return Response({
                "status": "success",
                "message": "User registered successfully.",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)

        required_fields = {"username", "email", "password"}
        has_required_error = any(
            field in serializer.errors and any("This field is required" in str(err) for err in serializer.errors[field])
            for field in required_fields
        )
        
        if has_required_error:
            return Response({"status": "error", "message": "The fields username, email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        first_error = next(iter(serializer.errors.values()))[0] if serializer.errors else "An error occurred."
        return Response({"status": "error", "message": first_error}, status=status.HTTP_400_BAD_REQUEST)