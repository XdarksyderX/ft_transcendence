from rest_framework.serializers import ModelSerializer
from core.models import Messages
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
        fields = '__all__'