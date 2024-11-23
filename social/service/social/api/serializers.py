from rest_framework import serializers
from social.models import User, Status, Friends

# PROFILE SERIALIZERS
class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['online', 'missing', 'disconnected']

class ProfileSerializer(serializers.ModelSerializer):
    status = StatusSerializer(source='status', read_only=True)  # Incluye el estado relacionado

    class Meta:
        model = User
        fields = ['id', 'user', 'avatar', 'status']


# FRIENDS LIST SERIALIZER
class FriendsListSerializer(serializers.ModelSerializer):
    friends = serializers.SerializerMethodField()
    pending_friends = serializers.SerializerMethodField()
    blocked = serializers.SerializerMethodField()

    class Meta:
        model = Friends
        fields = ['user', 'friends', 'pending_friends', 'blocked']

    def get_friends(self, obj):
        return self._get_user_details(obj.friends)

    def get_pending_friends(self, obj):
        return self._get_user_details(obj.pending_friends)

    def get_blocked(self, obj):
        return self._get_user_details(obj.blocked)

    def _get_user_details(self, user_ids):
        users = User.objects.filter(id__in=user_ids)
        return [{'id': user.id, 'user': user.user} for user in users]
