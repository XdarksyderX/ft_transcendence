from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import Http404
from core.models import User, PendingInvitationRequest
from core.utils.event_domain import publish_event

class SendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, friend_username):
        try:
            target_user = get_object_or_404(User, username=friend_username)
        except Http404:
            return Response({
                "status": "error",
                "message": "Resource not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        if target_user == request.user:
            return Response({
                "status": "error",
                "message": "You cannot send a friend request to yourself."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if target_user.blocked.filter(id=request.user.id).exists():
            return Response({
                "status": "error",
                "message": "You cannot send a friend request to this user."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.friends.filter(id=target_user.id).exists():
            return Response({
                "status": "error",
                "message": "This user is already your friend."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if PendingInvitationRequest.objects.filter(sender=request.user, receiver=target_user).exists():
            return Response({
                "status": "error",
                "message": "Friend request already sent."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invitation = PendingInvitationRequest.objects.create(sender=request.user, receiver=target_user)
        request.user.outgoing_requests.add(invitation)
        target_user.incoming_requests.add(invitation)
        return Response({
            "status": "success",
            "message": "Friend request sent successfully."
            "invitation_id": invitation.id
        }, status=status.HTTP_201_CREATED)

class PendingReceivedRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        incoming_requests = list(request.user.incoming_requests.values("id", "receiver__username", "sender__username", "timestamp"))
        return Response({
            "status": "success",
            "message": "Incoming pending requests retrieved successfully.",
            "incoming": incoming_requests
        }, status=status.HTTP_200_OK)

class PendingSentRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        outgoing_requests = list(request.user.outgoing_requests.values("id", "receiver__username", "sender__username", "timestamp"))
        return Response({
            "status": "success",
            "message": "Outgoing pending requests retrieved successfully.",
            "outgoing": outgoing_requests
        }, status=status.HTTP_200_OK)

class AcceptRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id):
        try:
            invitation = get_object_or_404(PendingInvitationRequest, id=invitation_id)
        except Http404:
            return Response({
                "status": "error",
                "message": "Resource not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.user != invitation.receiver:
            return Response({
                "status": "error",
                "message": "You are not the receiver of this invitation."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.receiver.friends.add(invitation.sender)
        invitation.sender.friends.add(invitation.receiver)
        invitation.delete()
        publish_event("social", "social.friend_added", {
            "user_id": invitation.receiver.id,
            "friend_id": invitation.sender.id
        })
        return Response({
            "status": "success",
            "message": "Friend request accepted."
        }, status=status.HTTP_200_OK)

class DeclineRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id):
        try:
            invitation = get_object_or_404(PendingInvitationRequest, id=invitation_id)
        except Http404:
            return Response({
                "status": "error",
                "message": "Resource not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.user != invitation.receiver:
            return Response({
                "status": "error",
                "message": "You are not the receiver of this invitation."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.delete()
        return Response({
            "status": "success",
            "message": "Friend request rejected."
        }, status=status.HTTP_200_OK)

class CancelRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id):
        try:
            invitation = get_object_or_404(PendingInvitationRequest, id=invitation_id)
        except Http404:
            return Response({
                "status": "error",
                "message": "Resource not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.user != invitation.sender:
            return Response({
                "status": "error",
                "message": "You are not the sender of this invitation."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.delete()
        return Response({
            "status": "success",
            "message": "Friend request canceled."
        }, status=status.HTTP_200_OK)
