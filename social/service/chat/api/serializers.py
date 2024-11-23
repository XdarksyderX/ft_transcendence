from rest_framework.serializers import ModelSerializer
from chat.models import Messages
class MessagesSerializer(ModelSerializer):
    """
    Serializers:
        Transform the model information to JSON format

    Args:
        ModelSerializer:
            Class from Django Rest Framework used for create serializers.
    """
    class Meta:
        model = Messages
        fields = ['id', 'sender_id', 'receiver_id', 'content', 'created_at']