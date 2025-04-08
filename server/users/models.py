from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
# from event.models import Event

class Profile(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True)
    profile_picture = models.URLField(max_length=500, blank=True, null=True)
    title = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)
    organizerVerified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.username

class SocialMediaLink(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="social_media_links")
    platform = models.CharField(
            choices=[
                ('twitter', 'Twitter'),
                ('linkedin', 'LinkedIn'),
                ('instagram', 'Instagram'),
                ('github', 'GitHub'),
                ('website', 'Personal Website'),
                ('other', 'Other'),
            ],
            default='other',)
    url= models.URLField(max_length=200)
    
    class Meta:
        unique_together = ('user','platform')
    
    def __str__(self):
        return f"{self.user.username} - {self.get_platform_display()}"
    
class UserSettings(models.Model):
    user = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="settings")
    notification = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False, help_text="Receive promotional emails")
    two_factor_auth = models.BooleanField(default=False, help_text="Enable 2FA")
    theme = models.CharField(
        choices=[('light', 'Light'), ('dark', 'Dark')],
        default='light',
        help_text="UI theme preference"
    )

    def __str__(self):
        return f"Settings for {self.user.username}"
    
    
class Wallet(models.Model):
    user = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet of {self.user.username} - ₹{self.balance}"

class WalletTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('PAYMENT', 'Payment'),
        ('REFUND', 'Refund'),
    ]
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    transaction_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    def __str__(self):
        return f"{self.transaction_type} of ₹{self.amount} for {self.wallet.user.username}"
    

class Booking(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('wallet', 'Wallet'),
        ('stripe', 'Stripe'),
    ]

    booking_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='bookings')
    event = models.ForeignKey('event.Event', on_delete=models.CASCADE, related_name='bookings')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES) 
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  
    total = models.DecimalField(max_digits=10, decimal_places=2)
    track_discount = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    coupon = models.ForeignKey('Admin.Coupon', on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')  
    ticket_purchases = models.ManyToManyField('event.TicketPurchase', related_name='booking')  
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True) 

    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Booking {self.booking_id} for {self.event.event_title} by {self.user.username}"
    
class PasswordResetToken(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from django.utils import timezone
            self.expires_at = timezone.now() + timezone.timedelta(hours=1)
        super().save(*args, **kwargs)

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at