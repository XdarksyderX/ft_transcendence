from django.db import models
from service.core.models import User

class PlayerStats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="stats")
    classic_wins = models.PositiveIntegerField(default=0)
    classic_losses = models.PositiveIntegerField(default=0)
    atomic_wins = models.PositiveIntegerField(default=0)
    atomic_losses = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - Stats"

    def total_wins(self):
        return self.classic_wins + self.atomic_wins

    def total_losses(self):
        return self.classic_losses + self.atomic_losses

    class Meta:
        verbose_name = "Player Statistics"
        verbose_name_plural = "Players Statistics"