from rest_framework.serializers import ModelSerializer
from core.models import Message
from rest_framework import serializers
from core.models import Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender_id', 'receiver_id', 'sent_at', 'is_read']
