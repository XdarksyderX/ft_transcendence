from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from social.models import Friends
from social.api.serializers import FriendsListSerializer

class FriendListAPIView(APIView):
    def get(self, request, user_id):
        try:
            friend_data = Friends.objects.get(user_id=user_id)
            serializer = FriendsListSerializer(friend_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Friends.DoesNotExist:
            return Response({'error': 'Friend data not found'}, status=status.HTTP_404_NOT_FOUND)