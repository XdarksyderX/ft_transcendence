from django.db import models
from django.contrib.auth.models import AbstractUser
import random

def generate_random_bigint():
    return int.from_bytes(random.randbytes(6), 'little')

class User(AbstractUser):
    id = models.BigIntegerField(primary_key=True, default=generate_random_bigint, editable=False)
    username = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    two_fa_enabled = models.BooleanField(default=False)
    oauth_registered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    two_fa = models.OneToOneField('TwoFA', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.username


class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    verification_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification for {self.user.username}"

class PasswordReset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reset_token = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Password reset for {self.user.username}"


class TwoFA(models.Model):
    secret = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"2FA for {self.user.username}"

class OutgoingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    data = models.JSONField()

class IncomingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
