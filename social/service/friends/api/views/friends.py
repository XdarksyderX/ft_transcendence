from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import Http404
from core.models import User
from core.utils.event_domain import publish_event
from rest_framework.permissions import IsAuthenticated

class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friends_list = [{"username": friend.username, "avatar": friend.avatar.url, "is_online": friend.is_online, "alias": friend.alias} for friend in request.user.friends.all()]
        return Response({
            "status": "success",
            "message": "Friends list retrieved successfully.",
            "friends": friends_list
        }, status=status.HTTP_200_OK)


class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, friend_username):
        try:
            friend_user = get_object_or_404(User, username=friend_username)
        except Http404:
            return Response({
                "status": "error",
                "message": "Resource not found"
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user.friends.filter(id=friend_user.id).exists():
            request.user.friends.remove(friend_user)
            friend_user.friends.remove(request.user)
            publish_event("social", "social.friend_removed", {
                "user_id": request.user.id,
                "friend_id": friend_user.id
            })
            return Response({
                "status": "success",
                "message": "Friend deleted successfully."
            }, status=status.HTTP_200_OK)

        return Response({
            "status": "error",
            "message": "You cannot unfriend a non-friend."
        }, status=status.HTTP_400_BAD_REQUEST)
