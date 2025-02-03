from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404

from core.models import User, PendingInvitationRequest

class FriendsListView(APIView):
    """
    Returns the list of friends of the authenticated user.
    """
    def get(self, request):
        try:
            # Get the list of friends
            friends = request.user.friends.all()
            
            friends_list = [
            {
                "username": friend.username,
                "avatar": friend.avatar,
                "online": friend.is_online  # Cambia `is_online` si usas otro campo
            }
            for friend in friends
            ]
            
            response = {
                "status": "success",
                "message": "Friends list retrieved successfully.",
                "friends": friends_list
            }

            return Response(response, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BlockedListView(APIView):
    """
    Returns the list of friends of the authenticated user.
    """
    def get(self, request):
        try:
            # Get the list of blocked users
            users_blocked = request.user.blocked.all()

            response = {
                "status": "success",
                "message": "Blocked list retrieved successfully.",
                "blocked": users_blocked.map(lambda user: user.username).list()
            }
            
            return Response(response, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RemoveFriendView(APIView):
    """
    Removes a user from the authenticated user's friends list and vice versa.
    """
    def post(self, request):

        try:
            friend_username = request.data.get("friend_username")

            # Get the user corresponding to the friend's username
            friend_user = get_object_or_404(User, username=friend_username)

            friends_usernames = request.user.friends.all().map(lambda user: user.username).list()

            # Verify if both are friends
            if friend_username in friends_usernames:
                # Remove from both friends lists
                request.user.friends.remove(friend_user)
                friend_user.friends.remove(request.user.username)

                # Save the changes
                request.user.save()
                friend_user.save()

                return Response({"status":"success", "message": "Friend deleted successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"status":"error", "message": "You cannot unfriend a non friend"}, status=status.HTTP_400_BAD_REQUEST)
            
        except User.DoesNotExist:
            return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PendingReceivedRequestsView(APIView):
    """
    Returns the pending friend requests received by the user.
    """
    def get(self, request):

        try:
            pending_requests = request.user.incoming_requests.all()
            response = {
                "status": "success",
                "message": "Incoming pending requests retrieved successfully.",
                "incoming": [{
                    "invitation_id": friend_request.invitation_id,
                    "receiver": friend_request.receiver.username,
                    "sender": friend_request.sender.username,
                    "timestamp": friend_request.timestamp

                } for friend_request in pending_requests]
            }
            return Response(response, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PendingSentRequestsView(APIView):
    """
    Returns the pending friend requests sent by the user.
    """
    def get(self, request):
        try:
            pending_requests = request.user.outgoing_pending.all()
            response = {
                "status": "success",
                "message": "Outgoing pending requests retrieved successfully.",
                "outgoing": [{
                    "invitation_id": friend_request.invitation_id,
                    "receiver": friend_request.receiver.username,
                    "sender": friend_request.sender.username,
                    "timestamp": friend_request.timestamp

                } for friend_request in pending_requests]
            }
            return Response(response, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AcceptRequestView(APIView):
    """
    Accepts a friend request.
    """
    def post(self, request):
        try:
            if not request.data.get("invitation_id"):
                return Response({"status":"error", "message":"The invitation_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            invitation = PendingInvitationRequest.objects.get(invitation_id=request.data.get("invitation_id"))
            if request.user.user_id != invitation.receiver.user_id:
                return Response({"status":"error", "message":"You are not the receiver of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
            receiver = User.objects.get(user_id = invitation.receiver) # request.user
            sender = User.objects.get(user_id = invitation.sender)
            receiver.friends.add(sender)
            sender.friends.add(receiver)
            receiver.incoming_requests.remove(invitation)
            sender.outgoing_requests.remove(invitation)
            invitation.delete()
            return Response({"status":"success", "message":"Friend request accepted."}, status=status.HTTP_200_OK)
        except PendingInvitationRequest.DoesNotExist:
            return Response({'status':'error', 'message': 'Invalid invitation'}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DeclineRequestView(APIView):
    """
    Rechaza una solicitud de amistad.
    """
    def post(self, request):
            try:
                if not request.data.get("invitation_id"):
                    return Response({"status":"error", "message":"The invitation_id is required."}, status=status.HTTP_400_BAD_REQUEST)
                
                invitation = PendingInvitationRequest.objects.get(invitation_id=request.data.get("invitation_id"))
                if request.user.user_id != invitation.receiver.user_id:
                    return Response({"status":"error", "message":"You are not the receiver of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
                invitation.receiver.incoming_requests.remove(invitation)
                invitation.sender.outgoing_requests.remove(invitation)
                invitation.delete()
                return Response({"status":"success", "message":"Friend request rejected."}, status=status.HTTP_200_OK)
            except PendingInvitationRequest.DoesNotExist:
                return Response({'status':'error', 'message': 'Invalid invitation'}, status=status.HTTP_404_NOT_FOUND)
            except User.DoesNotExist:
                return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CancelRequestView(APIView):
    """
    Cancels a friend request sent by the user.
    """
    def post(self, request):
        try:
            if not request.data.get("invitation_id"):
                return Response({"status":"error", "message":"The invitation_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            invitation = PendingInvitationRequest.objects.get(invitation_id=request.data.get("invitation_id"))
            if request.user.user_id != invitation.sender.user_id:
                return Response({"status":"error", "message":"You are not the sender of this invitation."}, status=status.HTTP_400_BAD_REQUEST)
            receiver = User.objects.get(user_id = invitation.receiver)
            sender = User.objects.get(user_id = invitation.sender)
            receiver.incoming_requests.remove(invitation)
            sender.outgoing_requests.remove(invitation)
            invitation.delete()
            return Response({"status":"success", "message":"Friend request rejected."}, status=status.HTTP_200_OK)
        except PendingInvitationRequest.DoesNotExist:
            return Response({'status':'error', 'message': 'Invalid invitation'}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


