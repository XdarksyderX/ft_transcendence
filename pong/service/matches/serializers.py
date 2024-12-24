from rest_framework import serializers
from core.models import MatchHistory, MatchInvitation, PongGame

class MatchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchHistory
        fields = ['id', 'user', 'game', 'outcome', 'created_at']


class MatchInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchInvitation
        fields = ['id', 'sender', 'receiver', 'game', 'token', 'status', 'created_at']
        read_only_fields = ['token', 'created_at']


class PendingMatchesSerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()

    class Meta:
        model = PongGame
        fields = ['id', 'opponent', 'is_tournament', 'status', 'available']

    def get_opponent(self, obj):
        request_user = self.context.get('request').user
        if obj.player1.user_id == request_user.id:
            return obj.player2.username
        return obj.player1.username


class MatchInvitationDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchInvitation
        fields = ['id', 'sender', 'receiver', 'game', 'token', 'status', 'created_at']
