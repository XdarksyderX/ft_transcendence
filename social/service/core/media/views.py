from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
from django.conf import settings
import os

class ProtectedMediaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, path):
        file_path = os.path.join(settings.MEDIA_ROOT, path)

        if not os.path.exists(file_path):
            return Response(
                {"status": "error", "message": "File not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            return FileResponse(open(file_path, 'rb'))
        except Exception as e:
            return Response(
                {"status": "error", "message": "Error accessing the file."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
