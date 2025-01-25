from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from django.http import JsonResponse
from social.models import User

import jwt
from config.settings import JWT_SECRET

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
    def post(self, request, username): # TODO o me pasa el block_user_id o el username y con la API obtengo el ID
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
            try:
                user_data = User.objects.get(user_id=decoded_payload["user_id"])
            except user_data.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            # Verify if the user is trying to block himself
            if user_data.username == username:
                return Response({'error': 'You cannot block yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            # Verify if the user to block exists
            # try:
            User.objects.get(username=username)
            # except User.DoesNotExist:
            #     return Response({'error': 'User to block does not exist.'}, status=status.HTTP_404_NOT_FOUND)

            # Verify is the user is already blocked
            if username in user_data.blocked:
                return Response({'message': f'User {username} is already blocked.'}, 
                                status=status.HTTP_200_OK)

            # Add the user
            user_data.blocked.append(username)
            user_data.save()

            return Response({'message': f'User {username} has been blocked successfully.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        # except Friends.DoesNotExist:
        #     return Response({'error': 'Friend data not found for the user.'}, 
        #                     status=status.HTTP_404_NOT_FOUND)
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
    def post(self, request, user_id, username):
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
            try:
                user_data = User.objects.get(user_id=decoded_payload["user_id"])
            except user_data.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            # Verify if the user is trying to block himself
            if user_data.username == username:
                return Response({'error': 'You cannot unblock yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            # Verify if the user to unblock exists
            try:
                User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({'error': 'User to block does not exist.'}, status=status.HTTP_404_NOT_FOUND)

            # Verify if the user is blocked
            if username not in user_data.blocked:
                return Response({'message': f'User {username} is not blocked.'}, 
                                status=status.HTTP_200_OK)

            # Delete the user from the list
            user_data.blocked.remove(username)
            user_data.save()

            return Response({'message': f'User {username} has been unblocked successfully.'}, 
                            status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class IsUserBlockedView(APIView):
    """
    APIView to check if a user is blocked.
    """
    def get(self, request, target_username):
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
            try:
                user = User.objects.get(user_id=decoded_payload["user_id"])
            except user.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


            
            # Check if the target user is in the blocked list
            is_blocked = target_username in user.blocked

            return Response({"is_blocked": is_blocked}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


# TODO API METER FECHA LISTA DE AMIGOS (OPCIONAL)