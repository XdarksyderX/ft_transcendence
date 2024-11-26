from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from social.models import Friends
from social.api.serializers import FriendsListSerializer
import jwt
from django.http import JsonResponse
from config.settings import JWT_SECRET

class FriendListView(APIView):
    """
        Content:
            This return the all friend lists.

        Args:
            APIView:
                Class from Django Rest Framework used for create views for HTTP request.

        Returns:
            The friend list or a error message
      """
    def get(self, request, user_id):
        # TODO hacer una funcion con esto y usarlo pra la apis, asi estaría autenticado
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Invalid or missing Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

        # Extraer el token JWT (después de 'Bearer ')
        jwt_token = auth_header.split('Bearer ')[1]
        try:
            decoded_payload = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
        except:
            return Response({'error: invalid auth cookie'}, status=status.HTTP_401_UNAUTHORIZED)
        # TE DEVUELVE EL ID: user_id = decoded_payload["id"]
        try:
            friend_data = Friends.objects.get(user_id=user_id)
            serializer = FriendsListSerializer(friend_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Friends.DoesNotExist:
            return Response({'error': 'Friend data not found'}, status=status.HTTP_404_NOT_FOUND)

# class PendingFriendListView(APIView):
#     def get(self, request, user_id):
#         try:
#             friend_data = Friends.objects.get(user_id=user_id)
#             serializer = FriendsListSerializer.get_pending_friends(friend_data)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except Friends.DoesNotExist:
#             return Response({'error': 'Friend data not found'}, status=status.HTTP_404_NOT_FOUND)

# class BlockedFriendListView(APIView):
#     def get(self, request, user_id):
#         try:
#             friend_data = Friends.objects.get(user_id=user_id)
#             serializer = FriendsListSerializer.get_blocked(friend_data)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except Friends.DoesNotExist:
#             return Response({'error': 'Friend data not found'}, status=status.HTTP_404_NOT_FOUND)