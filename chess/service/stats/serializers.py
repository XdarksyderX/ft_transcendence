from rest_framework import serializers
from core.models import ChessStatistics
from django.contrib.auth import get_user_model

User = get_user_model()

class ChessStatisticsSerializer(serializers.ModelSerializer):
	username = serializers.CharField(source='user.username', read_only=True)
	
	class Meta:
		model = ChessStatistics
		fields = [
			'games_played', 
			'games_won', 
			'games_lost', 
			'draws', 
			'highest_rating',
			'created_at', 
			'updated_at'
		]
		read_only_fields = ['games_played', 'games_won', 'games_lost', 'draws', 'highest_rating', 'created_at', 'updated_at']