from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from social.models import Friends, User

class AcceptFriendRequestView(APIView):
    """
        Content:
            This function accept the friend petition from other user

        Args:
            APIView:
                Class from Django Rest Framework used for create views for HTTP request.

        Returns:
            Status messages, if is added to the friend list, or errors
    """
    def post(self, request, friend_id):
        if not request.user:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            # TODO middleare: ver como redireccion al usuario para que se loguee

        try:
            # Verify the users
            user = request.user # TODO modificado por eso lo otro da error
            friend_user = User.objects.get(id=friend_id) # TODO  no se si esto sería id o user_id

            user_friend_data, _ = Friends.objects.get_or_create(user=user)
            friend_friend_data, _ = Friends.objects.get_or_create(user=friend_user)

            # Verify if the user if in the pending list
            if friend_id not in user_friend_data.pending_friends:
                return Response({'error': f'User {friend_id} is not in pending friends list.'}, 
                                status=status.HTTP_400_BAD_REQUEST)

            # Move the user to friend
            user_friend_data.pending_friends.remove(friend_id)
            user_friend_data.friends.append(friend_id)
            user_friend_data.save()

            # In the other user, put the user in the friend list too
            if user_id in friend_friend_data.pending_friends:
                        friend_friend_data.pending_friends.remove(user_id)
            friend_friend_data.friends.append(user_id)
            friend_friend_data.save()

            return Response({'message': f'User {friend_id} has been added to friends list.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DenyFriendRequestView(APIView):
    def post(self, request, user_id, friend_id):
        """
        Content:
            This function deny the friend petition from other user

        Args:
            APIView:
                Class from Django Rest Framework used for create views for HTTP request.

        Returns:
            Status messages, if is added to the friend list, or errors
        """
        try:
            # Verify the users
            user = User.objects.get(id=user_id)
            friend_user = User.objects.get(id=friend_id)

            user_friend_data, _ = Friends.objects.get_or_create(user=user)

            # Verify if the user is in the pending list
            if friend_id not in user_friend_data.pending_friends:
                return Response({'error': f'User {friend_id} is not in pending friends list.'}, 
                                status=status.HTTP_400_BAD_REQUEST)

            # Delete the user from the list
            user_friend_data.pending_friends.remove(friend_id)
            user_friend_data.save()

            return Response({'message': f'User {friend_id} has been removed from pending friends list.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SendFriendRequestView(APIView):
    def post(self, request, user_id, friend_id):
        """
        Content:
            This function send the friend petition from other user

        Args:
            APIView:
                Class from Django Rest Framework used for create views for HTTP request.

        Returns:
            Status messages, if is added to the friend list, or errors
        """
        try:
            # Verify the users
            user = User.objects.get(id=user_id)
            friend_user = User.objects.get(id=friend_id)

            # Check is the request if for the same user
            if user_id == friend_id:
                return Response({'error': 'You cannot send a friend request to yourself.'}, 
                                status=status.HTTP_400_BAD_REQUEST)

            friend_friend_data, _ = Friends.objects.get_or_create(user=friend_user)

            # Verify if the user is friend or is in the pending friend
            if user_id in friend_friend_data.friends:
                return Response({'error': f'User {user_id} is already a friend.'}, 
                                status=status.HTTP_400_BAD_REQUEST)

            if user_id in friend_friend_data.pending_friends:
                return Response({'error': f'User {user_id} has already sent a request.'}, 
                                status=status.HTTP_400_BAD_REQUEST)

            # Add the user
            friend_friend_data.pending_friends.append(user_id)
            friend_friend_data.save()

            return Response({'message': f'Friend request sent to user {friend_id}.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
