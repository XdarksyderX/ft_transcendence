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
    user = models.CharField(max_length = 20, unique = True, verbose_name = 'Username', blank = False)
    avatar = models.CharField(verbose_name = 'Avatar URL', default = 'URL_DEFAULT_AVATAR')

    def __str__(self) -> str:
        return self.user

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

class Friends(models.Model):
    """
    Content:
        This table has the id , friends, pending friends and blocked users.

    Args:
        models.Model (class from Django for define Data Models).

    Returns:
        Void
    """
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends', verbose_name='friends')
    friends = models.JSONField(default=list)
    pending_friends = models.JSONField(default=list)
    blocked = models.JSONField(default=list)