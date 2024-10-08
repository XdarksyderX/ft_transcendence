from django.db import models
from django.contrib.auth.models import User
import uuid

# Create your models here.
class Room(models.Model):
    name = models.CharField(max_length = 100, unique = True, verbose_name = 'Nombre')
    users = models.ManyToManyField(User, related_name = 'rooms_joined', blank = True)

    def __str__(self):
        return self.name

class Message(models.Model): # Guarada los mensajes
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Usuario')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, verbose_name='Sala')
    message = models.TextField(verbose_name='Mensaje')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Enviado')

    def __str__(self):
        return self.message
    
# New for Transcenders
class User(models.Model):
    user = models.CharField(max_length = 20, unique = True, verbose_name = 'Username', blank = True)

    def __str__(self):
        return self.user

class Group(models.Model):
    group_name = models.CharField(max_length = 20, verbose_name = 'Group Name', blank = True)
    room_code = models.CharField(max_length = 50, unique = True, verbose_name = 'Room Code', default=uuid.uuid4)
    public = models.BooleanField(default=False, verbose_name='Public Status')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created Date')

    def __str__(self):
        return self.group_name

class Group_user(models.Model):
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE, verbose_name='Group ID')
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='User ID')

class Messages(models.Model):
    content = models.CharField(max_length=300, verbose_name='Message')
    sender_id = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Sender ID')
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE, verbose_name='Group ID')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created Date')

    def __str__(self):
        return self.content

class Direct_messages(models.Model):
    sender_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='Sender ID')
    receiver_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', verbose_name='Receiver ID')
    message_id = models.ForeignKey(Messages, on_delete=models.CASCADE, verbose_name='Receiver ID')
