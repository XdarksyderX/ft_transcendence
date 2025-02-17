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

class PendingInvitationSerializer(serializers.ModelSerializer):
    # Receiver is provided as a username
    receiver = serializers.CharField()
    # Sender is represented as username, read-only
    sender = serializers.CharField(source='sender.username', read_only=True)
    token = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = PendingInvitation
        fields = ['id', 'sender', 'receiver', 'token', 'created_at']

    def validate_receiver(self, value):
        request = self.context.get("request")
        if request:
            try:
                receiver_user = User.objects.get(username=value)
            except User.DoesNotExist:
                raise serializers.ValidationError("The receiver does not exist.")
            # Validate that the receiver is a friend of the authenticated user
            if receiver_user not in request.user.friends.all():
                raise serializers.ValidationError("The user is not your friend.")
            return receiver_user
        raise serializers.ValidationError("Could not retrieve the request user.")

    def create(self, validated_data):
        sender = self.context['request'].user
        receiver = validated_data.pop('receiver')
        game = PongGame.objects.create(
            player1=sender,
            player2=receiver,
            status='pending',
            available=True
        )
        invitation = PendingInvitation.objects.create(sender=sender, receiver=receiver, game=game)
        return invitation

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
        fields = ['id', 'opponent', 'is_tournament', 'status', 'available']

    def get_opponent(self, obj):
        request_user = self.context.get('request').user
        # Check if the request user is player1; if so, return player2's username, otherwise vice versa.
        if obj.player1.id == request_user.id:
            return obj.player2.username
        return obj.player1.username
