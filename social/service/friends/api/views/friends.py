from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from core.models import User, PendingInvitationRequest
from core.utils.event_domain import publish_event
from rest_framework.permissions import IsAuthenticated

class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        friends_list = [{"username": friend.username, "avatar": friend.avatar, "is_online": friend.is_online} for friend in request.user.friends.all()]
        return Response({"status": "success", "message": "Friends list retrieved successfully.", "friends": friends_list}, status=status.HTTP_200_OK)

class BlockedListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        blocked_list = list(request.user.blocked.values_list("username", flat=True))
        return Response({"status": "success", "message": "Blocked list retrieved successfully.", "blocked": blocked_list}, status=status.HTTP_200_OK)

class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        friend_user = get_object_or_404(User, username=request.data.get("friend_username"))
        if request.user.friends.filter(id=friend_user.id).exists():
            request.user.friends.remove(friend_user)
            friend_user.friends.remove(request.user)
            publish_event("social", "social.friend_removed", {"user_id": request.user.id, "friend_id": friend_user.id})
            return Response({"status": "success", "message": "Friend deleted successfully."}, status=status.HTTP_200_OK)
        return Response({"status": "error", "message": "You cannot unfriend a non-friend."}, status=status.HTTP_400_BAD_REQUEST)

class PendingReceivedRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        incoming_requests = list(request.user.incoming_requests.values("id", "receiver__username", "sender__username", "timestamp"))
        return Response({"status": "success", "message": "Incoming pending requests retrieved successfully.", "incoming": incoming_requests}, status=status.HTTP_200_OK)

class PendingSentRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        outgoing_requests = list(request.user.outgoing_requests.values("id", "receiver__username", "sender__username", "timestamp"))
        return Response({"status": "success", "message": "Outgoing pending requests retrieved successfully.", "outgoing": outgoing_requests}, status=status.HTTP_200_OK)

class AcceptRequestView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        invitation = get_object_or_404(PendingInvitationRequest, id=request.data.get("invitation_id"))
        if request.user != invitation.receiver:
            return Response({"status": "error", "message": "You are not the receiver of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
        invitation.receiver.friends.add(invitation.sender)
        invitation.sender.friends.add(invitation.receiver)
        invitation.delete()
        publish_event("social", "social.friend_added", {"user_id": invitation.receiver.id, "friend_id": invitation.sender.id})
        return Response({"status": "success", "message": "Friend request accepted."}, status=status.HTTP_200_OK)

class DeclineRequestView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        invitation = get_object_or_404(PendingInvitationRequest, id=request.data.get("invitation_id"))
        if request.user != invitation.receiver:
            return Response({"status": "error", "message": "You are not the receiver of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
        invitation.delete()
        return Response({"status": "success", "message": "Friend request rejected."}, status=status.HTTP_200_OK)

class CancelRequestView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        invitation = get_object_or_404(PendingInvitationRequest, id=request.data.get("invitation_id"))
        if request.user != invitation.sender:
            return Response({"status": "error", "message": "You are not the sender of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
        invitation.delete()
        return Response({"status": "success", "message": "Friend request canceled."}, status=status.HTTP_200_OK)
