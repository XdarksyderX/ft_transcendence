from django.contrib.auth import get_user_model
from rest_framework import serializers
from core.models import ChessGame, PendingInvitation

User = get_user_model()

class ChessGameSerializer(serializers.ModelSerializer):
    player_white = serializers.CharField(source='player_white.username', read_only=True)
    player_black = serializers.CharField(source='player_black.username', read_only=True)
    winner = serializers.CharField(source='winner.username', read_only=True, default=None)
    
    class Meta:
        model = ChessGame
        fields = [
            'id',
            'player_white',
            'player_black',
            'winner',
            'game_mode',
            'status',
            'created_at',
           # 'updated_at'
        ]

class ChessGameHistorySerializer(serializers.ModelSerializer):
    player_white = serializers.CharField(source='player_white.username', read_only=True)
    player_black = serializers.CharField(source='player_black.username', read_only=True)
    winner = serializers.CharField(source='winner.username', read_only=True, default=None)
    
    class Meta:
        model = ChessGame
        fields = [
            'id',
            'player_white',
            'player_black',
            'winner',
            'game_mode',
            'status',
            'is_ranked',
            'created_at',
            'updated_at'
        ]

class PendingInvitationDetailSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username', read_only=True)
    receiver = serializers.CharField(source='receiver.username', read_only=True)
    token = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = PendingInvitation
        fields = ['id', 'sender', 'receiver', 'token', 'created_at']

class PendingMatchesSerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()
    
    class Meta:
        model = ChessGame
        fields = ['id', 'opponent', 'status', 'available', 'game_key']
    
    def get_opponent(self, obj):
        request_user = self.context.get('request').user
        if obj.player_white.id == request_user.id:
            return obj.player_black.username
        return obj.player_white.username
