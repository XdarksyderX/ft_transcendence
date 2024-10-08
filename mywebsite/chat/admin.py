from django.contrib import admin
from .models import Room, Message, User, Group, Group_user
# Register your models here.

class MessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'message', 'timestamp')

    # Filtros para filtrar la información
    list_filter = ('room', 'user')


admin.site.register(Message, MessageAdmin)
admin.site.register(Room)

# Transcenders
admin.site.register(User)
admin.site.register(Group)
admin.site.register(Group_user)