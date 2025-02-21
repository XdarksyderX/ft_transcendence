from rest_framework.serializers import ModelSerializer
from core.models import Message
from rest_framework import serializers
from core.models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username', read_only=True)
    receiver = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Message
        fields = ['content', 'sender', 'receiver', 'sent_at', 'is_read', 'is_special']

