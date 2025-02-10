from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import User
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data

class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, username):
        if request.user.username == username:
            return Response({'status': 'error', 'message': 'You cannot block yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_block = User.objects.filter(username=username).first()
        if not user_to_block:
            return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.blocked.filter(id=user_to_block.id).exists():
            return Response({'status': 'error', 'message': f'You have already blocked {username}.'}, status=status.HTTP_409_CONFLICT)

        request.user.blocked.add(user_to_block)

        event_data = wrap_event_data({}, 'social.user_blocked', str(request.user.id))
        RabbitMQClient().publish(exchange='social', routing_key='social.user_blocked', message=event_data)

        return Response({'status': 'success', 'message': f'User {username} has been blocked successfully.'}, status=status.HTTP_200_OK)


class UnblockUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, username):
        if request.user.username == username:
            return Response({'status': 'error', 'message': 'You cannot unblock yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_unblock = User.objects.filter(username=username).first()
        if not user_to_unblock:
            return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if not request.user.blocked.filter(id=user_to_unblock.id).exists():
            return Response({'status': 'error', 'message': f'User {username} is not blocked.'}, status=status.HTTP_409_CONFLICT)

        request.user.blocked.remove(user_to_unblock)

        event_data = wrap_event_data({}, 'social.user_unblocked', str(request.user.id))
        RabbitMQClient().publish(exchange='social', routing_key='social.user_unblocked', message=event_data)

        return Response({'status': 'success', 'message': f'User {username} has been unblocked successfully.'}, status=status.HTTP_200_OK)


class IsUserBlockedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, target_username):
        is_blocked = request.user.blocked.filter(username=target_username).exists()
        return Response({'status': 'success', 'message': 'Blocked status retrieved successfully', 'is_blocked': is_blocked}, status=status.HTTP_200_OK)
