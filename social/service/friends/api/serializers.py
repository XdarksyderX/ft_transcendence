from rest_framework import serializers
from core.models import User, Status

class ProfileSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'status']

    def get_status(self, obj):
        return obj.status.name if hasattr(obj, 'status') and obj.status else None

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else "/media/default.png"

class SearchUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else "/media/default.png"
