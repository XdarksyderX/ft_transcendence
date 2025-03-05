from django.contrib.auth import get_user_model
from rest_framework import serializers
from core.models import PendingInvitation, PongGame
from rest_framework import serializers
from core.models import PongGame


User = get_user_model()


class PongGameSerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source='player1.username', read_only=True)
    player2 = serializers.CharField(source='player2.username', read_only=True)
    winner = serializers.CharField(source='winner.username', read_only=True, default=None)
    
    class Meta:
        model = PongGame
        fields = [
            'id',
            'player1',
            'player2',
            'winner',
            'player1_score',
            'player2_score',
            'status',
            'created_at',
            'updated_at'
        ]


class PongGameHistorySerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source='player1.username', read_only=True)
    player2 = serializers.CharField(source='player2.username', read_only=True)
    winner = serializers.CharField(source='winner.username', read_only=True, default=None)

    class Meta:
        model = PongGame
        fields = [
            'id',
            'player1',
            'player2',
            'winner',
            'player1_score',
            'player2_score',
            'status',
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
        model = PongGame
        fields = ['id', 'opponent', 'is_tournament', 'status', 'game_key']

    def get_opponent(self, obj):
        request_user = self.context.get('request').user
        # Check if the request user is player1; if so, return player2's username, otherwise vice versa.
        if obj.player1.id == request_user.id:
            return obj.player2.username
        return obj.player1.username
