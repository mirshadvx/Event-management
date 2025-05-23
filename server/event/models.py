from django.db import models
from users.models import Profile, Booking
import uuid

class Event(models.Model):
    VISIBILITY_CHOICES = [
        ('Public', 'Public'),
        ('Private', 'Private'),
    ]

    EVENT_TYPE_CHOICES = [
        ('Conference', 'Conference'),
        ('Workshop', 'Workshop'),
        ('Seminar', 'Seminar'),
        ('Concert', 'Concert'),
        ('Festival', 'Festival'),
    ]

    # Basic Information
    organizer = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='events')
    event_title = models.CharField(max_length=255)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    description = models.TextField()
    
    # Venue Details
    venue_name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    
    # Date and Time
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    start_time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    
    # Event Settings
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='Public')
    capacity = models.IntegerField()
    age_restriction = models.BooleanField(default=False)
    special_instructions = models.TextField(blank=True, null=True)
    
    # Branding
    event_banner = models.URLField(max_length=500, blank=True, null=True)
    promotional_image = models.URLField(max_length=500, blank=True, null=True)
    is_draft = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    revenue_distributed = models.BooleanField(default=False)
    published_at = models.DateField()
    
    def __str__(self):
        return f"{self.event_title} by {self.organizer.username}"
    
    def like_count(self):
        return self.likes.count()

    def comment_count(self):
        return self.comments.count()
    
    def total_tickets_sold(self):
        return sum(ticket.sold_quantity for ticket in self.tickets.all())
    
class Ticket(models.Model):
    TICKET_TYPE_CHOICES = [
        ('Regular', 'Regular'),
        ('Gold', 'Gold'),
        ('VIP', 'VIP'),
    ]

    event = models.ForeignKey(Event, related_name='tickets', on_delete=models.CASCADE)
    ticket_type = models.CharField(max_length=50, choices=TICKET_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=0)
    sold_quantity = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ('event', 'ticket_type')

    def __str__(self):
        return f"{self.ticket_type} ticket for {self.event.event_title}"


class TicketPurchase(models.Model):
    buyer = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='ticket_purchases')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_purchases')
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='purchases')
    quantity = models.PositiveIntegerField()
    used_tickets = models.PositiveIntegerField(default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchased_at = models.DateTimeField(auto_now_add=True)
    unique_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    unique_qr_code = models.CharField(max_length=36, unique=True, default=uuid.uuid4) 
    booking_id = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.quantity} {self.ticket.ticket_type} tickets for {self.event.event_title}  -- {self.buyer.username}"

class Like(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='likes')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user.username} liked {self.event.event_title}"


class Comment(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='comments')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} commented on {self.event.event_title}"
    
class LiveStream(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='live_streams')
    room_id = models.CharField(max_length=100, unique=True)
    stream_status = models.CharField(max_length=20, choices=[
        ('live', 'Live'),
        ('ended', 'Ended')
    ], default='live')
    organizer = models.ForeignKey(Profile, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Stream for {self.event}"