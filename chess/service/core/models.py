from django.db import models

class User(models.Model):
    user_id = models.IntegerField(unique=True)
    username = models.CharField(max_length=150)

    def __str__(self):
        return self.username