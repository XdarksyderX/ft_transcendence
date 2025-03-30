from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    username = models.CharField(max_length=20, unique=True, verbose_name='Username')
    alias = models.CharField(max_length=20, unique=False, verbose_name='Alias', blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, default='avatars/default.png')
    friends = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=True,
    )
    blocked = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        related_name='user_blocked'
    )
    
    incoming_requests = models.ManyToManyField(
        'PendingInvitationRequest',
        blank=True,
        related_name='incoming_users'
    )
    outgoing_requests = models.ManyToManyField(
        'PendingInvitationRequest',
        blank=True,
        related_name='outgoing_requests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_online = models.BooleanField(default=False)

    def __str__(self):
        return self.username

class PendingInvitationRequest(models.Model):
    id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from User {self.sender_id} to User {self.receiver_id} is_pending: ({self.timestamp})"

class Status(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='status', verbose_name='Status')
    online = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"User id: {self.user_id}, Status: {'online' if self.online else 'offline'}"
    
class OutgoingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    data = models.JSONField()

class IncomingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    content = models.CharField(max_length=300, blank=False, verbose_name='message_content')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='sender')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', verbose_name='receiver')
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name='sent_at')
    is_read = models.BooleanField(default=False, verbose_name='is_read')
    is_special = models.BooleanField(default=False, verbose_name='is_special')

    def __str__(self) -> str:
        return f'From {self.sender} to {self.receiver}: {self.content[:30]}'
    
    class Meta:
        ordering = ['sent_at']
