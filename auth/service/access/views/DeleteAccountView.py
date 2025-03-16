from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..serializers import DeleteAccountSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from core.utils.event_domain import publish_event

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
                publish_event("auth", "auth.user_deleted", {"user_id": user.id})
                
                response = Response(
                    {"status": "success", "message": "Account deleted successfully"},
                    status=status.HTTP_200_OK
                )
                refresh_token = request.COOKIES.get('refresh_token')
                if refresh_token:
                    try:
                        refresh = RefreshToken(refresh_token)
                        refresh.blacklist()
                        publish_event("auth", "auth.user_logged_out", {"user_id": refresh["user_id"]})
                    except Exception as e:
                        print(f"Error during logout: {e}")
                response.delete_cookie('access_token')
                response.delete_cookie('refresh_token')
                return response
                
            except Exception as e:
                return Response(
                    {"status":"error", "message": "Failed to delete account"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )