from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import AccessToken

class VerifyTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.COOKIES.get("access_token")
        if not access_token:
            return Response(
                {"status": "error", "message": "Access token not found in cookies."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            AccessToken(access_token)
            return Response({"status": "success", "message": "Token is valid."}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"status": "error", "message": "Invalid or expired access token."},
                status=status.HTTP_401_UNAUTHORIZED
            )