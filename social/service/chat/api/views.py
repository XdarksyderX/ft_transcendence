from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import Http404
from core.models import User
from core.utils.event_domain import publish_event
from rest_framework.permissions import IsAuthenticated

class CreateMessageView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = MessagesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Message sent successfully."
            }, status=status.HTTP_201_CREATED)
        return Response({
            "status": "error",
            "message": "Message not sent/saved."
        }, status=status.HTTP_400_BAD_REQUEST)
    

class AllChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages_qs = Messages.objects.filter(
            Q(sender_id=request.user.id) | Q(receiver_id=request.user.id)
        ).order_by('created_at')

        conversations = {}

        for message in messages_qs:
            # Determinamos quién es el partner en la conversación:
            if message.sender_id == request.user.id:
                partner = message.receiver_id
                sender_label = "out"
            else:
                partner = message.sender_id
                sender_label = "in"
            
            # Creamos la conversación si aún no existe
            if partner.id not in conversations:
                conversations[partner.id] = {
                    "id": partner.id,
                    "name": partner.username,
                    "messages": []
                }
            
            # Generamos un índice secuencial para el mensaje dentro de la conversación.
            msg_index = len(conversations[partner.id]["messages"]) + 1

            conversations[partner.id]["messages"].append({
                "id": msg_index,
                "text": message.content,
                "sender": sender_label,
                "read": message.is_read
            })

        chats = list(conversations.values())
        return Response({
            "status": "success",
            "message": "ALL Chats History successfully.",
            "history": chats
        }, status=status.HTTP_200_OK)

class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, friend_username):

        try:
            friend_user = get_object_or_404(User, username=friend_username)
        except Http404:
            return Response({
                "status": "error",
                "message": "Resource not found"
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user.friends.filter(id=friend_user.id).exists():
            messages = Messages.objects.filter(
                Q(sender_id=request.sender_id, receiver_id_id=friend_user.id) | Q(sender_id_id=friend_user.id, receiver_id_id=request.sender_id)
            ).order_by('created_at')
        serializer = MessagesSerializer(messages, many=True)
        return Response({
            "status": "success",
            "message": "Chat history retrieved successfully.",
            "history": serializer.data
        }, status=status.HTTP_200_OK)
