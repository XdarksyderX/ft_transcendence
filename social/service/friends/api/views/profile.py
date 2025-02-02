from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from core.models import User
from friends.api.serializers import ProfileSerializer

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
            serializer = ProfileSerializer(request.user)
            response = {
                'status': 'success',
                'message': 'User profile data retrieved successfully.',
                'data': serializer.data
            }
            return Response(response, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SearchUsersView(APIView):
    """
    APIView to search for users by their username.
    """
    def get(self, request, username):
        try:
            # Search for users whose username contains the search term (case-insensitive)
            users = User.objects.filter(username__icontains=username)

            # Prepare the response data
            users_data = [{
                "user_id": user.user_id,
                "username": user.username,
                "avatar": user.avatar
            } for user in users]

            return Response({users_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)