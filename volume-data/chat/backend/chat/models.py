from django.db import models
import uuid

class User(models.Model):
    """
    Content:
        This table has only the id and the username.
        The id is used for link sernder_id and the receiver_id in the table Message.

    Args:
        models.Model (class from Django for define Data Models).

    Returns:
        User value.
    """
    user = models.CharField(max_length = 20, unique = True, verbose_name = 'Username', blank = True)

    def __str__(self) -> str:
        return self.user

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

    def __str__(self) -> str:
        return f'From {self.sender_id} to {self.receiver_id}: {self.content[:30]}'
    
    class Meta:
        ordering = ['created_at']