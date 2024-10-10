from django.contrib import admin
from .models import User, Messages

"""
Use:
    Register the User and Message Models for the Admin Panel
"""
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['user']

@admin.register(Messages)
class MessagesAdmin(admin.ModelAdmin):
    list_display = ['sender_id', 'receiver_id', 'content']