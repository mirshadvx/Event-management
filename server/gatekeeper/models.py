from django.db import models
from django.utils import timezone

class ManagedUser(models.Model):
    event = models.ForeignKey(
        "event.Event", on_delete=models.CASCADE,related_name="managed_users"
    )
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=130)
    permission_given_date = models.DateTimeField(default=timezone.now)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.event.event_title})"