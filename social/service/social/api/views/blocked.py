from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from social.models import Friends, User

class BlockUserView(APIView):
    """
    Content:
        This function add a user in the blocked user list from other user.

    Args:
        APIView:
            Class from Django Rest Framework used for create views for HTTP request.

    Returns:
        Status messages
    """
    def post(self, request, user_id, block_user_id):
        try:
            # Verify the users
            user = User.objects.get(id=user_id)
            block_user = User.objects.get(id=block_user_id)

            friend_data, created = Friends.objects.get_or_create(user=user)

            # Verify is the user is already blocked
            if block_user_id in friend_data.blocked:
                return Response({'message': f'User {block_user_id} is already blocked.'}, 
                                status=status.HTTP_200_OK)

            # Add the user
            friend_data.blocked.append(block_user_id)
            friend_data.save()

            return Response({'message': f'User {block_user_id} has been blocked successfully.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Friends.DoesNotExist:
            return Response({'error': 'Friend data not found for the user.'}, 
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
    def post(self, request, user_id, unblock_user_id):
        try:
            # Verify the users
            user = User.objects.get(id=user_id)
            unblock_user = User.objects.get(id=unblock_user_id)

            friend_data = Friends.objects.get(user=user)

            # Verify if the user is blocked
            if unblock_user_id not in friend_data.blocked:
                return Response({'message': f'User {unblock_user_id} is not blocked.'}, 
                                status=status.HTTP_200_OK)
            if user_id == unblock_user_id:
                return Response({'error': 'You cannot unblock yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            # Delete the user from the list
            friend_data.blocked.remove(unblock_user_id)
            friend_data.save()

            return Response({'message': f'User {unblock_user_id} has been unblocked successfully.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Friends.DoesNotExist:
            return Response({'error': 'Friend data not found for the user.'}, 
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)