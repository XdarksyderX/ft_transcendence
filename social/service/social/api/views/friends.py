from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from social.models import Friends
from social.api.serializers import FriendsListSerializer
import jwt
from django.http import JsonResponse
from config.settings import JWT_SECRET
from django.shortcuts import get_object_or_404

from social.models import User, InvitationRequest
from social.api.serializers import InvitationRequestSerializer

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
            user_data = User.objects.get(user_id=decoded_payload["user_id"])

            pending_requests = user_data.received_requests.filter(status=InvitationRequest.Status.PENDING)
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
            user_data = User.objects.get(user_id=decoded_payload["user_id"])

            pending_requests = user_data.sent_requests.filter(status=InvitationRequest.Status.PENDING)
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
