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
        return "online" if obj.is_online else "offline"
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
    is_friend = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'alias', 'is_friend', 'status']

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else "/media/avatars/default.png"

    def get_is_friend(self, obj): #it doesnt work
        request = self.context.get('request')
        if request and hasattr(request.user, 'friends'):
            return obj in request.user.friends.all()
        return False

    def get_status(self, obj):
        # Only return the status if the user is a friend
        if self.get_is_friend(obj):
            return "online" if obj.is_online else "offline"
        return None