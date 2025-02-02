from django.db import models

class User(models.Model):
    """
    Content:
        This table has the id, the username, and the avatar URL.
        The id is used to link sender_id and receiver_id in the Message table.

    Args:
        models.Model (class from Django to define Data Models).

    Returns:
        User value.
    """
    user_id = models.CharField(max_length=20, unique=True, verbose_name='User ID', blank=False)
    username = models.CharField(max_length=20, unique=True, verbose_name='Username', blank=False)
    avatar = models.URLField(max_length=200, blank=True, null=True)
    
    friends = models.ManyToManyField('self', blank=True, symmetrical=True, related_name='user_friends')
    blocked = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='user_blocked')

    incoming_requests = models.ManyToManyField('InvitationRequest', blank=True, related_name='incoming_users')
    outcoming_requests = models.ManyToManyField('InvitationRequest', blank=True, related_name='outcoming_users')

    def __str__(self) -> str:
        return self.username
    
    

class InvitationRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING'
        ACCEPTED = 'ACCEPTED'
        DECLINED = 'DECLINED'

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from User {self.sender_id} to User {self.receiver_id} ({self.status})"

class Status(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='status', verbose_name='Status')
    online = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"User id: {self.user_id}, Status: {'online' if self.online else 'offline'}"

    # TODO meter friend y blocked en el modelo user, Crear un modelo con lista de invitaciones enviada y recibidas