from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    username = models.CharField(max_length=20, unique=True, verbose_name='Username')
    pending_notifications = models.ManyToManyField(
        'PendingNotification',
        blank=True,
        related_name='pending_notifications'
    )

class PendingNotification(models.Model):
	id = models.AutoField(primary_key=True)
	receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receiver')
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Pending notification for user with id {self.receiver.id}"

class OutgoingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    data = models.JSONField()

class IncomingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)