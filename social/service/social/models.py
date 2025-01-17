from django.db import models

class User(models.Model):
    """
    Content:
        This table has the id ,the username and the avatar url.
        The id is used for link sender_id and the receiver_id in the table Message.

    Args:
        models.Model (class from Django for define Data Models).

    Returns:
        User value.
    """
    user_id = models.CharField(max_length=20, unique=True, verbose_name='User ID', blank=False) # TODO middlewareÑ ver si esto asi sería correcto
    # user = models.CharField(max_length = 20, unique = True, verbose_name = 'Username', blank = False) # TODO QUITAR USER Y RECIBIRLO POR COOKIE, CMABIAR APIS PARA USAR ID 
    avatar = models.URLField(max_length=200, blank=True, null=True)
    friends = models.JSONField(default=list)
    blocked = models.JSONField(default=list)
    incoming_requests = models.ManyToManyField('InvitationRequest', blank=True, related_name='incoming_users')
    outcoming_requests = models.ManyToManyField('InvitationRequest', blank=True, related_name='outcoming_users')


    def __str__(self) -> str:
        return self.user

class InvitationRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        ACCEPTED = 'ACCEPTED', _('Accepted')
        DECLINED = 'DECLINED', _('Declined')

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
    """
    Content:
        This table content the users status
    Args:
        models.Model (class from Django for define Data Models).
    Returns:
        USer ID and Status Value
    """
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='status', verbose_name='Status')
    online = models.BooleanField(default=False)
    missing = models.BooleanField(default=False)
    disconnected = models.BooleanField(default=True)

    def __str__(self) -> str:
        if self.online == True:
            return f"User id: {self.user_id}, Status: Online"
        elif self.missing == True:
            return f"User id: {self.user_id}, Status: Missing"
        elif self.disconnected == True:
            return f"User id: {self.user_id}, Status: Disconnected"

# class Friends(models.Model):
#     """
#     Content:
#         This table has the id , friends, pending friends and blocked users.

#     Args:
#         models.Model (class from Django for define Data Models).

#     Returns:
#         Void
#     """
#     user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends', verbose_name='friends')
#     pending_friends = models.JSONField(default=list)

    # TODO meter friend y blocked en el modelo user, Crear un modelo con lista de invitaciones enviada y recibidas