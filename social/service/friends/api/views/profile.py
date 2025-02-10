from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from core.models import User
from friends.api.serializers import ProfileSerializer

class ProfileView(APIView):
    def get(self, request):
        try:
            serializer = ProfileSerializer(request.user)
            return Response({
                'status': 'success',
                'message': 'User profile data retrieved successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error', 
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
class SearchUsersView(APIView):
    def get(self, request, username):
        try:
            users = User.objects.filter(username__icontains=username)
            users_data = [
                {
                    "user_id": user.user_id,
                    "username": user.username,
                    "avatar": user.avatar
                } for user in users
            ]
            return Response({
                'status': 'success',
                'message': 'Users retrieved successfully.',
                'users': users_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
