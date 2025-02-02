from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from friends.models import Friends
from friends.api.serializers import FriendsListSerializer
import jwt
from django.http import JsonResponse
from config.settings import JWT_SECRET
from django.shortcuts import get_object_or_404

from friends.models import User, InvitationRequest
from friends.api.serializers import InvitationRequestSerializer, ProfileSerializer, UserInfoSerializer

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
                request.user.friends.
                friend_user.friends.remove(request.user.username)

                # Save the changes
                request.user.save()
                friend_user.save()

                return Response({"message": "Amigo eliminado exitosamente."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "El usuario especificado no es amigo."}, status=status.HTTP_400_BAD_REQUEST)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PendingReceivedRequestsView(APIView):
    """
    Returns the pending friend requests received by the user.
    """
    

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

            # Verify the user
            request.user = User.objects.get(user_id=decoded_payload["user_id"])

            pending_requests = request.user.received_requests.filter(status=InvitationRequest.Status.PENDING)
            serializer = InvitationRequestSerializer(pending_requests, many=True)
            return Response(serializer.data)
        
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PendingSentRequestsView(APIView):
    """
    Returns the pending friend requests sent by the user.
    """
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

            # Verify the user
            request.user = User.objects.get(user_id=decoded_payload["user_id"])

            pending_requests = request.user.sent_requests.filter(status=InvitationRequest.Status.PENDING)
            serializer = InvitationRequestSerializer(pending_requests, many=True)
            return Response(serializer.data)
        
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AcceptRequestView(APIView):
    """
    Accepts a friend request.
    """
    def post(self, request):
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')

            if not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Invalid or missing Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

            jwt_token = auth_header.split('Bearer ')[1]
            try:
                decoded_payload = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
            except:
                return Response({'error: invalid auth cookie'}, status=status.HTTP_401_UNAUTHORIZED)

            # Verify the user
            current_user = User.objects.get(user_id=decoded_payload["user_id"])
            # Other User
            other_username = request.data.get("username")
            if not other_username:
                return Response({"error": "The other Username is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Get the user corresponding to the username
                other_user = get_object_or_404(User, username=other_username)

                # Find the pending request where the logged-in user is the receiver
                invitation_request = InvitationRequest.objects.get(
                    sender=other_user, receiver=current_user, status=InvitationRequest.Status.PENDING
                )

                # Update the status of the request
                invitation_request.status = InvitationRequest.Status.ACCEPTED
                invitation_request.save()

                # Add friends mutually
                current_user.friends.append(other_user.username)
                other_user.friends.append(current_user.username)
                current_user.save()
                other_user.save()

                return Response({"message": "Request Accepted."}, status=status.HTTP_200_OK)
            except InvitationRequest.DoesNotExist:
                return Response({"error": "Request NOT FOUND"}, status=status.HTTP_404_NOT_FOUND)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DeclineRequestView(APIView):
    """
    Rechaza una solicitud de amistad.
    """
    def post(self, request):
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')

            if not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Invalid or missing Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

            jwt_token = auth_header.split('Bearer ')[1]
            try:
                decoded_payload = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
            except:
                return Response({'error: invalid auth cookie'}, status=status.HTTP_401_UNAUTHORIZED)

            # Verify the user
            current_user = User.objects.get(user_id=decoded_payload["user_id"])
            # Other User
            other_username = request.data.get("username")
            if not other_username:
                return Response({"error": "The other Username is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Get the user corresponding to the username
                other_user = get_object_or_404(User, username=other_username)

                # Find the pending request where the logged-in user is the receiver
                invitation_request = InvitationRequest.objects.get(
                sender=other_user, receiver=current_user, status=InvitationRequest.Status.PENDING
                )

                # Update the status of the request
                invitation_request.status = InvitationRequest.Status.DECLINED
                invitation_request.save()

                return Response({"message": "Request Declined."}, status=status.HTTP_200_OK)
            except InvitationRequest.DoesNotExist:
                return Response({"error": "Request NOT FOUND"}, status=status.HTTP_404_NOT_FOUND)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CancelSentRequestView(APIView):
    """
    Cancels a friend request sent by the user.
    """
    def post(self, request):
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')

            if not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Invalid or missing Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

            jwt_token = auth_header.split('Bearer ')[1]
            try:
                decoded_payload = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
            except:
                return Response({'error: invalid auth cookie'}, status=status.HTTP_401_UNAUTHORIZED)

            # Verify the user
            current_user = User.objects.get(user_id=decoded_payload["user_id"])
            # Other User
            other_username = request.data.get("username")
            if not other_username:
                return Response({"error": "The other Username is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Get the user corresponding to the username
                other_user = get_object_or_404(User, username=other_username)

                # Find the pending request where the logged-in user is the receiver
                invitation_request = InvitationRequest.objects.get(
                sender=current_user, receiver=other_user, status=InvitationRequest.Status.PENDING
                )

                # Delete the request
                invitation_request.delete()

                return Response({"message": "Request Deleted."}, status=status.HTTP_200_OK)
            except InvitationRequest.DoesNotExist:
                return Response({"error": "Request NOT FOUND"}, status=status.HTTP_404_NOT_FOUND)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# TODO API METER FECHA LISTA DE AMIGOS (OPCIONAL)