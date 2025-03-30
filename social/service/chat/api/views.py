import logging
from rest_framework import permissions
from core.models import Message, User
from chat.api.serializers import MessageSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from rest_framework.views import APIView

logger = logging.getLogger(__name__)
# logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class MessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, other_username, format=None):
        user = request.user
        try:
            other = User.objects.get(username=other_username)
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": "User not found"
            }, status=404)
        messages = Message.objects.filter(
            Q(sender=user, receiver=other) | 
            Q(sender=other, receiver=user)
        ).order_by("-sent_at")
        serializer = MessageSerializer(messages, many=True)
        return Response({
            "status": "success",
            "messages": serializer.data[::-1]
        })

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_as_read(request, other_username):
    try:
        sender = User.objects.get(username=other_username)
    except User.DoesNotExist:
        return Response({
            "status": "error",
            "message": "Sender not found"
        }, status=404)
    messages = Message.objects.filter(sender=sender, receiver=request.user, is_read=False)
    messages.update(is_read=True)
    return Response({
        "status": "success",
        "message": "Messages were marked as read"
    })

class RecentChatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        logger.debug(f"Authenticated user: {user.username}")

        messages = Message.objects.filter(Q(sender=user) | Q(receiver=user))
        logger.debug(f"Messages found: {messages.count()}")

        conversation_users = set()
        for msg in messages:
            participant = msg.receiver if msg.sender == user else msg.sender
            conversation_users.add(participant)

        logger.debug(f"Conversation users: {[u.username for u in conversation_users]}")

        # Blocked users
        user_model = User.objects.get(username=user)
        blocked_users = user_model.blocked.all()

        recent_chats = {}
        for participant in conversation_users:
            participat_user_model = User.objects.get(username=participant)
            participant_blocked = participat_user_model.blocked.all()
            if participant not in blocked_users and user not in participant_blocked:
                chat = Message.objects.filter(
                    Q(sender=user, receiver=participant) |
                    Q(sender=participant, receiver=user)
                ).order_by("-sent_at").first()

                if chat:
                    recent_chats[participant.username] = {
                        "lastMessage": chat.content,
                        "lastUpdated": chat.sent_at,
                        "is_read": chat.is_read,
                        "is_special": chat.is_special,
                        "sender": "in" if chat.sender != user else "out"
                    }

        return Response({"status": "success", "recent_chats": recent_chats})

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def unread_messages_indicator(request):
    user = request.user
    logger.debug(f"Authenticated user: {user.username}")

    unread_count = Message.objects.filter(receiver=user, is_read=False).count()
    logger.debug(f"Unread messages count: {unread_count}")

    has_unread = unread_count > 0
    return Response({
        "status": "success",
        "has_unread_messages": has_unread
    })