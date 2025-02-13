from rest_framework import serializers
from core.models import PendingInvitation, PongGame

from rest_framework import serializers
from core.models import PongGame

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


class PendingInvitationSerializer(serializers.ModelSerializer):
    game = serializers.PrimaryKeyRelatedField(queryset=PongGame.objects.all())

    class Meta:
        model = PendingInvitation
        fields = ['id', 'sender', 'receiver', 'game', 'token', 'created_at']
        read_only_fields = ['token', 'created_at']


class PendingInvitationDetailSerializer(serializers.ModelSerializer):
    game = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PendingInvitation
        fields = ['id', 'sender', 'receiver', 'game', 'token', 'created_at']


class PendingMatchesSerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()

    class Meta:
        model = PongGame
        fields = ['id', 'opponent', 'is_tournament', 'status', 'available']

    def get_opponent(self, obj):
        request_user = self.context.get('request').user
        # Check if the request user is player1; if so, return player2's username, otherwise vice versa.
        if obj.player1.id == request_user.id:
            return obj.player2.username
        return obj.player1.username
