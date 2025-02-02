from rest_framework import serializers
from service.game.models import ChessGame

class ChessGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChessGame
        fields = ['game_id', 'player_one', 'player_two', 'game_type', 'status', 'winner', 'created_at', 'updated_at']
