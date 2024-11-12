from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..serializers import AccessTokenSerializer

class VerifyTokenView(APIView):
    def post(self, request):
        serializer = AccessTokenSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data["access_token"], status=status.HTTP_200_OK)
        return Response({"status": "error", "message": serializer.errors}, status=status.HTTP_401_UNAUTHORIZED)
