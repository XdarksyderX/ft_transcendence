from rest_framework import serializers
from core.models import User, Status

class ProfileSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    total_friends = serializers.SerializerMethodField()  # New field
    alias = serializers.SerializerMethodField()  # Updated to use a method field

    class Meta:
        model = User
        fields = ['id', 'username', 'alias', 'avatar', 'status', 'total_friends']  # Include the new field

    def get_status(self, obj):
        return obj.status.name if hasattr(obj, 'status') and obj.status else None

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else "/media/avatars/default.png"

    def get_total_friends(self, obj):
        # Assuming there is a related_name 'friends' for the user's friends
        return obj.friends.count()

    def get_alias(self, obj):
        # Return alias if set, otherwise return username
        return obj.alias if obj.alias else obj.username

class SearchUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else "/media/avatars/default.png"
