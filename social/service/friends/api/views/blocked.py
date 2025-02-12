from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import User
from core.utils.event_domain import publish_event

class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, target_username):
        if request.user.username == target_username:
            return Response({'status': 'error', 'message': 'You cannot block yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_block = User.objects.filter(username=target_username).first()
        if not user_to_block:
            return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.blocked.filter(id=user_to_block.id).exists():
            return Response({'status': 'error', 'message': f'You have already blocked {target_username}.'}, status=status.HTTP_409_CONFLICT)

        request.user.blocked.add(user_to_block)
        publish_event("social", "social.user_blocked", {"user_id": request.user.id, "blocked_user_id": user_to_block.id})
        return Response({'status': 'success', 'message': f'User {target_username} has been blocked successfully.'}, status=status.HTTP_200_OK)

class UnblockUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, target_username):
        if request.user.username == target_username:
            return Response({'status': 'error', 'message': 'You cannot unblock yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_unblock = User.objects.filter(username=target_username).first()
        if not user_to_unblock:
            return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if not request.user.blocked.filter(id=user_to_unblock.id).exists():
            return Response({'status': 'error', 'message': f'User {target_username} is not blocked.'}, status=status.HTTP_409_CONFLICT)

        request.user.blocked.remove(user_to_unblock)
        publish_event("social", "social.user_unblocked", {"user_id": request.user.id, "unblocked_user_id": user_to_unblock.id})

        return Response({'status': 'success', 'message': f'User {target_username} has been unblocked successfully.'}, status=status.HTTP_200_OK)

class IsUserBlockedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, target_username):
        is_blocked = request.user.blocked.filter(username=target_username).exists()
        return Response({
            'status': 'success',
            'message': 'Blocked status retrieved successfully',
            'is_blocked': is_blocked
        }, status=status.HTTP_200_OK)

class BlockedListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        blocked_list = list(request.user.blocked.values_list("username", flat=True))
        return Response({"status": "success", "message": "Blocked list retrieved successfully.", "blocked": blocked_list}, status=status.HTTP_200_OK)