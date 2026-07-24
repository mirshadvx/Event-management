from django.db import models
from django.utils import timezone

class ManagedUser(models.Model):
    event = models.ForeignKey(
        "event.Event", on_delete=models.CASCADE,related_name="managed_users"
    )
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=130)
    permission_given_date = models.DateTimeField(default=timezone.now)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.event.event_title})"


class TicketScanLog(models.Model):
    STATUS_CHOICES = [
        ("valid", "Valid"),
        ("used", "Already Used"),
        ("invalid", "Invalid"),
    ]

    event = models.ForeignKey(
        "event.Event", on_delete=models.CASCADE, related_name="ticket_scan_logs"
    )
    guard = models.ForeignKey(
        ManagedUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ticket_scan_logs",
    )
    ticket_purchase = models.ForeignKey(
        "event.TicketPurchase",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scan_logs",
    )
    scanned_code = models.CharField(max_length=120, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    message = models.CharField(max_length=255)
    holder = models.CharField(max_length=150, blank=True)
    tier = models.CharField(max_length=50, blank=True)
    booking_id = models.CharField(max_length=50, blank=True, null=True)
    used_tickets = models.PositiveIntegerField(null=True, blank=True)
    quantity = models.PositiveIntegerField(null=True, blank=True)
    remaining_tickets = models.PositiveIntegerField(null=True, blank=True)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scanned_at"]
        indexes = [
            models.Index(fields=["event", "-scanned_at"]),
            models.Index(fields=["event", "status"]),
        ]

    def __str__(self):
        return f"{self.status} scan for {self.event.event_title} at {self.scanned_at}"
