from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from social.models import User, Status
from social.api.serializers import ProfileSerializer
import jwt
from config.settings import JWT_SECRET
from django.http import JsonResponse

class ProfileView(APIView):
    """
    APIView:
        Manage the HTTP request from the API and return the response.

    Args:
        APIView:
            Class from Django Rest Framework used for create views for HTTP request.

    Return:
        The response is all work correctly, or a Error Messages if fail.
    """
    def get(self, request):
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')

            if not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Invalid or missing Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

            jwt_token = auth_header.split('Bearer ')[1]
            try:
                decoded_payload = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
            except:
                return Response({'error: invalid auth cookie'}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_data = User.objects.get(user_id=decoded_payload["user_id"])

            serializer = ProfileSerializer(user_data) # TODO no se si es user_data o user_data.user_id
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)