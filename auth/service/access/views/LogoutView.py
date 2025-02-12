from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from core.utils.event_domain import publish_event

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

                publish_event("auth", "auth.user_logged_out", {"user_id": refresh["user_id"]})

            except Exception as e:
                print(f"Error during logout: {e}")

        return response