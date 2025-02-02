from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from core.models import User

class BlockUserView(APIView): # GOOD
    """
    Content:
        This function add a user in the blocked user list from other user.

    Args:
        APIView:
            Class from Django Rest Framework used for create views for HTTP request.

    Returns:
        Status messages
    """
    def post(self, request, username):
        try:
            # Verify if the user is trying to block himself
            if request.user.username == username:
                return Response({'status':'error', 'message': 'You cannot block yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            # Verify if the user to block exists
            User.objects.get(username=username)

            # Verify is the user is already blocked
            if username in request.user.blocked:
                return Response({'status':'error', 'message': f'You have already blocked {username}.'}, 
                                status=status.HTTP_409_CONFLICT)

            # Add the user
            request.user.blocked.append(username)
            request.user.save()

            return Response({'status': 'success', 'message': f'User {username} has been blocked successfully.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        # except Friends.DoesNotExist:
        #     return Response({'status': 'error', 'message': 'Friend data not found for the user.'}, 
        #                     status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UnblockUserView(APIView):
    """
        Content:
            This function add a user in the blocked user list from other user.

        Args:
            APIView:
                Class from Django Rest Framework used for create views for HTTP request.

        Returns:
            Status messages
    """
    def post(self, request, user_id, username):
        try:
            # Verify if the user is trying to block himself
            if request.user.username == username:
                return Response({'status': 'error', 'message': 'You cannot unblock yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            # Verify if the user to unblock exists
            try:
                User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({'status': 'error', 'message': 'User to block does not exist.'}, status=status.HTTP_404_NOT_FOUND)

            # Verify if the user is blocked
            if username not in request.user.blocked:
                return Response({'status':'error', 'message': f'User {username} is not blocked.'}, 
                                status=status.HTTP_409_CONFLICT)

            # Delete the user from the list
            request.user.blocked.remove(username)
            request.user.save()

            return Response({'status':'success', 'message': f'User {username} has been unblocked successfully.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'status':'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'status':'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class IsUserBlockedView(APIView):
    """
    APIView to check if a user is blocked.
    """
    def get(self, request, target_username):
        try:
            # Check if the target user is in the blocked list
            is_blocked = target_username in request.user.blocked

            return Response({'status':'success', "message": "Blocked status retrieved successfully", "is_blocked": is_blocked}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'status':'error', "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
