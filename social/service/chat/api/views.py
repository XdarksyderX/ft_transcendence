from rest_framework import generics, permissions
from core.models import Message
from chat.api.serializers import MessageSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        receiver_id = self.kwargs["receiver_id"]
        return Message.objects.filter(
            (Q(sender_id=user, receiver_id=receiver_id) |
             Q(sender_id=receiver_id, receiver_id=user))
        ).order_by("-sent_at")

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_as_read(request, sender_id):
    messages = Message.objects.filter(sender_id=sender_id, receiver_id=request.user, is_read=False)
    messages.update(is_read=True)
    return Response({"status": "success", "message": "Messages were marked as read"})
