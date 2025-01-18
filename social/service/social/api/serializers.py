from rest_framework import serializers
from social.models import User, Status, InvitationRequest

# PROFILE SERIALIZERS
class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer to return the status and avatar of a user.
    """
    # Campo para obtener el status del usuario
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['username', 'avatar', 'status']

    def get_status(self, obj):
        """
        Retrieves the status of the user (online, missing, or disconnected).
        """
        try:
            user_status = Status.objects.get(user_id=obj)
            if user_status.online:
                return "Online"
            elif user_status.missing:
                return "Missing"
            elif user_status.disconnected:
                return "Disconnected"
            else:
                return "Unknown"
        except Status.DoesNotExist:
            return "No status available"


# FRIENDS LIST SERIALIZER
class InvitationRequestSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = InvitationRequest
        fields = ['user_id', 'sender', 'receiver', 'sender_username', 'receiver_username', 'status', 'timestamp']









# class FriendsListSerializer(serializers.ModelSerializer): # TODO es antiguo habrá que cambairlo
#     friends = serializers.SerializerMethodField()
#     pending_friends = serializers.SerializerMethodField()
#     blocked = serializers.SerializerMethodField()

#     class Meta:
#         model = Friends
#         fields = ['user', 'friends', 'pending_friends', 'blocked']

#     def get_friends(self, obj):
#         return self._get_user_details(obj.friends)

#     def get_pending_friends(self, obj):
#         return self._get_user_details(obj.pending_friends)

#     def get_blocked(self, obj):
#         return self._get_user_details(obj.blocked)

#     def _get_user_details(self, user_ids):
#         users = User.objects.filter(id__in=user_ids)
#         return [{'id': user.id, 'user': user.user} for user in users]
