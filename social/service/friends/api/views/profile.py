from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import Http404
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.images import get_image_dimensions
from friends.api.serializers import ProfileSerializer, SearchUserSerializer
from core.utils.event_domain import publish_event
from django.utils import timezone
from core.models import User
import os

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username=None):
        try:
            user = get_object_or_404(User, username=username) if username else request.user
        except Http404:
            return Response({
                'status': 'error',
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileSerializer(user)
        return Response({
            'status': 'success',
            'message': 'User profile data retrieved successfully.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class SearchUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        users = User.objects.filter(username__icontains=username).order_by('username')[:50]
        serializer = SearchUserSerializer(users, many=True)
        return Response({
            'status': 'success',
            'message': 'Users retrieved successfully.',
            'users': serializer.data
        }, status=status.HTTP_200_OK)

class ChangeAvatarView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        avatar_url = request.user.avatar.url if request.user.avatar else None
        return Response({'status': 'success', 'avatar': avatar_url}, status=status.HTTP_200_OK)

    def post(self, request):
        avatar = request.FILES.get('avatar')

        if not avatar:
            return Response({'status': 'error', 'message': 'No image uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        if avatar.size > 2 * 1024 * 1024:
            return Response({'status': 'error', 'message': 'File too large. Max size: 2MB.'}, status=status.HTTP_400_BAD_REQUEST)

        width, height = get_image_dimensions(avatar)
        if width > 1024 or height > 1024:
            return Response({'status': 'error', 'message': 'Image too large. Max dimensions: 1024x1024.'}, status=status.HTTP_400_BAD_REQUEST)

        extension = os.path.splitext(avatar.name)[1]
        new_name = f"{request.user.username}_{timezone.now().strftime('%Y%m%d%H%M%S')}{extension}"
        avatar.name = new_name

        if request.user.avatar and not request.user.avatar.name.endswith('default.png'):
            request.user.avatar.delete(save=False)

        user = request.user
        user.avatar = avatar
        user.save()

        avatar_url = user.avatar.url

        publish_event("social", "social.avatar_changed", {"user_id": user.id, "new_avatar": avatar_url})

        return Response({'status': 'success', 'message': 'Avatar updated successfully.', 'avatar': avatar_url}, status=status.HTTP_200_OK)

class ChangeAliasView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_alias = request.data.get('alias', '').strip()
        if not new_alias:
            return Response({'status': 'error', 'message': 'Alias cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_alias) > 20:
            return Response({'status': 'error', 'message': 'Alias cannot exceed 20 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        user.alias = new_alias
        user.save()
        publish_event("social", "social.alias_changed", {"user_id": user.id, "new_alias": new_alias
        })
        return Response({
            'status': 'success',
            'message': 'Alias updated successfully.',
            'alias': user.alias
        }, status=status.HTTP_200_OK)