from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from core.models import User, PendingInvitationRequest
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data

rabbitmq_client = RabbitMQClient()

class FriendsListView(APIView):
    def get(self, request):
        friends_list = [{"username": friend.username, "avatar": friend.avatar, "is_online": friend.is_online} for friend in request.user.friends.all()]
        return Response({"status": "success", "message": "Friends list retrieved successfully.", "friends": friends_list}, status=status.HTTP_200_OK)

class BlockedListView(APIView):
    def get(self, request):
        blocked_list = [user.username for user in request.user.blocked.all()]
        return Response({"status": "success", "message": "Blocked list retrieved successfully.", "blocked": blocked_list}, status=status.HTTP_200_OK)

class RemoveFriendView(APIView):
    def post(self, request):
        friend_user = get_object_or_404(User, username=request.data.get("friend_username"))
        if friend_user in request.user.friends.all():
            request.user.friends.remove(friend_user)
            friend_user.friends.remove(request.user)
            request.user.save()
            friend_user.save()
            event = wrap_event_data({}, "social.friend_removed", str(request.user.id))
            rabbitmq_client.publish("social", "social.friend_removed", event)
            return Response({"status": "success", "message": "Friend deleted successfully."}, status=status.HTTP_200_OK)
        return Response({"status": "error", "message": "You cannot unfriend a non-friend."}, status=status.HTTP_400_BAD_REQUEST)

class PendingReceivedRequestsView(APIView):
    def get(self, request):
        incoming_requests = [{"invitation_id": req.id, "receiver": req.receiver.username, "sender": req.sender.username, "timestamp": req.timestamp} for req in request.user.incoming_requests.all()]
        return Response({"status": "success", "message": "Incoming pending requests retrieved successfully.", "incoming": incoming_requests}, status=status.HTTP_200_OK)

class PendingSentRequestsView(APIView):
    def get(self, request):
        outgoing_requests = [{"invitation_id": req.id, "receiver": req.receiver.username, "sender": req.sender.username, "timestamp": req.timestamp} for req in request.user.outgoing_pending.all()]
        return Response({"status": "success", "message": "Outgoing pending requests retrieved successfully.", "outgoing": outgoing_requests}, status=status.HTTP_200_OK)

class AcceptRequestView(APIView):
    def post(self, request):
        invitation = get_object_or_404(PendingInvitationRequest, id=request.data.get("invitation_id"))
        if request.user != invitation.receiver:
            return Response({"status": "error", "message": "You are not the receiver of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
        invitation.receiver.friends.add(invitation.sender)
        invitation.sender.friends.add(invitation.receiver)
        invitation.delete()
        event = wrap_event_data({}, "social.friend_accepted", str(invitation.receiver.id))
        rabbitmq_client.publish("social", "social.friend_accepted", event)
        return Response({"status": "success", "message": "Friend request accepted."}, status=status.HTTP_200_OK)

class DeclineRequestView(APIView):
    def post(self, request):
        invitation = get_object_or_404(PendingInvitationRequest, id=request.data.get("invitation_id"))
        if request.user != invitation.receiver:
            return Response({"status": "error", "message": "You are not the receiver of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
        invitation.delete()
        return Response({"status": "success", "message": "Friend request rejected."}, status=status.HTTP_200_OK)

class CancelRequestView(APIView):
    def post(self, request):
        invitation = get_object_or_404(PendingInvitationRequest, id=request.data.get("invitation_id"))
        if request.user != invitation.sender:
            return Response({"status": "error", "message": "You are not the sender of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
        invitation.delete()
        return Response({"status": "success", "message": "Friend request canceled."}, status=status.HTTP_200_OK)
