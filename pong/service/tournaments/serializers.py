from rest_framework import serializers
from .models import Tournament, TournamentParticipant, TournamentGame


class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'organizer', 'status', 'max_participants', 'description', 'start_date', 'created_at', 'updated_at']

    def validate_start_date(self, value):
        from django.utils.timezone import now
        if value < now():
            raise serializers.ValidationError("Start date cannot be in the past.")
        return value


class TournamentParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentParticipant
        fields = ['id', 'tournament', 'participant', 'games_won', 'games_lost', 'created_at']


class TournamentGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentGame
        fields = ['id', 'tournament', 'match', 'round_number', 'created_at']
