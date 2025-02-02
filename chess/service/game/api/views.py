from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
import jwt
import uuid
from django.http import JsonResponse
from config.settings import JWT_SECRET
from django.shortcuts import get_object_or_404
from service.game.models import ChessGame
from .serializer import ChessGameSerializer

class ChessGameDetailView(APIView):
    """
    API endpoint to retrieve all the information of a specific chess game.
    """

    def get(self, request, unique_id):
        try:
            # Verify if the UUID is valid
            game_uuid = uuid.UUID(unique_id)

            # Search for the game with the provided unique_id
            game = ChessGame.objects.get(unique_id=game_uuid)

            # Serialize the game data
            serializer = ChessGameSerializer(game)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except ChessGame.DoesNotExist:
            return Response(
                {'error': 'Game not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {'error': 'Invalid unique_id format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'An unexpected error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
