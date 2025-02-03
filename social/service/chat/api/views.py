from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from chat.models import User, Messages
from .serializers import MessagesSerializer
import jwt
from django.http import JsonResponse
from config.settings import JWT_SECRET

class UserMessagesView(APIView):
    """
    APIView:
        Manage the HTTP request from the API and return the response.

    Args:
        APIView:
            Class from Django Rest Framework used for create views for HTTP request.

    Return:
        The response is all work correctly, or a Error Messages if fail.
    """
    def get(self, request, username2):
        try:

            auth_header = request.META.get('HTTP_AUTHORIZATION', '')

            if not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Invalid or missing Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

            jwt_token = auth_header.split('Bearer ')[1]
            try:
                decoded_payload = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
            except:
                return Response({'error: invalid auth cookie'}, status=status.HTTP_401_UNAUTHORIZED)

            # Find the user
            user = User.objects.get(user_id=decoded_payload["user_id"])
            user2 = User.objects.get(user=username2)
            
            # Obtain the messages
            messages = Messages.objects.filter(
                Q(sender_id=user, receiver_id=user2) |
                Q(sender_id=user2, receiver_id=user))

            # Mark messages as read
            messages.update(is_read=True)

            # Order the messages by created date
            messages = messages.order_by('created_at')
            
            # Serialize the messages
            serializer = MessagesSerializer(messages, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class UsersListsView(APIView):
    def get(self, request):
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')

            if not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Invalid or missing Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

            jwt_token = auth_header.split('Bearer ')[1]
            try:
                decoded_payload = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
            except:
                return Response({'error: invalid auth cookie'}, status=status.HTTP_401_UNAUTHORIZED)

            # Find the user
            user = User.objects.get(user_id=decoded_payload["user_id"])

            # Obtain the Users Lists
            chats = Messages.objects.filter(
                Q(sender_id=user) | Q(receiver_id=user)
            ).distinct()

            chat_users = set()
            for chat in chats:
                if chat.sender_id != user:
                    chat_users.add(chat.sender_id)
                if chat.receiver_id != user:
                    chat_users.add(chat.receiver_id)
            
            # Convert the format
            chat_user_list = [{"user": chat_user.user} for chat_user in chat_users]

            return Response({chat_user_list}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
