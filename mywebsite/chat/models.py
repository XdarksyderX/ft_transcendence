from django.db import models
from django.contrib.auth.models import User

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