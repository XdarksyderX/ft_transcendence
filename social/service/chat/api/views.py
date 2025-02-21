from rest_framework import permissions
from core.models import Message, User
from chat.api.serializers import MessageSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from rest_framework.views import APIView

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
