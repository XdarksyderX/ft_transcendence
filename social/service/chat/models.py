from django.db import models
from social.models import User

class Messages(models.Model):
    """
    Message Table:
        This table save the messages

    Args:
        models.Model (class from Django for define Data Models).

    Returns:
        String with the sender_id and receiver_id and the message.
    """
    content = models.CharField(max_length=300, blank=False, verbose_name='Message')
    sender_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='Sender ID')
    receiver_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', verbose_name='Receiver ID')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created Date')
    # TODO Poner una bool que sea si el mensaje ha sido leido y esto se tendra qu eimplementar a lo que devuelve la API

    def __str__(self) -> str:
        return f'From {self.sender_id} to {self.receiver_id}: {self.content[:30]}'
    
    class Meta:
        ordering = ['created_at']