from rest_framework import serializers
from core.models import User, Status

class ProfileSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['user_id', 'username', 'avatar', 'status']

    def get_status(self, obj):
        return obj.status.name if obj.status else None


class SearchUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'avatar']
