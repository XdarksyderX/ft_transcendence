from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.images import get_image_dimensions
from friends.api.serializers import ProfileSerializer
from core.models import User

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username=None):
        user = get_object_or_404(User, username=username) if username else request.user
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
        users_data = [
            {"user_id": user.id, "username": user.username, "avatar": user.avatar.url if user.avatar else None}
            for user in users
        ]
        return Response({
            'status': 'success',
            'message': 'Users retrieved successfully.',
            'users': users_data
        }, status=status.HTTP_200_OK)

class ChangeAvatarView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        avatar = request.FILES.get('avatar')

        if not avatar:
            return Response({'status': 'error', 'message': 'No image uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        if avatar.size > 2 * 1024 * 1024:
            return Response({'status': 'error', 'message': 'File too large. Max size: 2MB.'}, status=status.HTTP_400_BAD_REQUEST)

        width, height = get_image_dimensions(avatar)
        if width > 1024 or height > 1024:
            return Response({'status': 'error', 'message': 'Image too large. Max dimensions: 1024x1024.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.avatar = avatar
        user.save()

        return Response({'status': 'success', 'message': 'Avatar updated successfully.', 'avatar_url': user.avatar.url}, status=status.HTTP_200_OK)
