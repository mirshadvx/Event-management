from django.db import models
from users.models import Profile
from event.models import TicketPurchase, Event
from django.utils import timezone

class OrganizerRequest(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="organizer_requests")
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("approved", "Approved"),
            ("rejected", "Rejected"),
        ],
        default="pending",
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    handled_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, help_text="Notes from admin on approval/rejection")

    class Meta:
        unique_together = ("user",)

    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"
  
class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True) 
    title = models.CharField(max_length=100)
    discount_type = models.CharField(choices=[("fixed", "Fixed"), ("percentage", "Percentage")], max_length=20)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Discount amount or percentage")
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField(help_text="Coupon start date")
    end_date = models.DateField(help_text="Coupon expiration date")
    is_active = models.BooleanField(default=True, help_text="Is the coupon currently active?")
    usage_limit = models.PositiveIntegerField(default=1, help_text="Total usage limit across all users")
    used_count = models.PositiveIntegerField(default=0, help_text="How many times this coupon has been used")
    used_by = models.ManyToManyField(Profile, blank=True, related_name="used_coupons", help_text="Users who have used this coupon")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.title}"  

class Badge(models.Model):
    """
    Stores badge definitions created by the admin.
    """
    BADGE_CATEGORIES = (
        ("engagement", "Engagement"),
        ("exploration", "Exploration"),
        ("milestone", "Milestone"),
        ("contribution", "Contribution"),
        ("success", "Success"),
        ("quality", "Quality"),
    )

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField() 
    category = models.CharField(max_length=20, choices=BADGE_CATEGORIES)
    icon = models.URLField(max_length=500, blank=True, null=True) 
    target_count = models.PositiveIntegerField(default=1)
    applicable_role = models.CharField(
            choices=(("Orgnanzer","Orgnizer"),
                     ("User","User"),),
        )
    criteria_type = models.CharField(max_length=50,choices=(("event_attended", "Events Attended"),
            ("event_created", "Events Created"),
            ("feedback_given", "Feedback Given"),))
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class UserBadge(models.Model):
    """
    Tracks badges assigned to user/organizers and their progress.
    """
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="user_badges")
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    date_earned = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "badge")
        
    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
    
class RefundTicket(models.Model):
    REFUND_STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Completed", "Completed"),
        ("Reject", "Reject")
    ]
    
    ticket_purchase = models.OneToOneField(TicketPurchase, on_delete=models.CASCADE, related_name="refund")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(choices=REFUND_STATUS_CHOICES, default="Pending")
    initiated_at = models.DateTimeField(auto_now_add=False)
    completed_at = models.DateTimeField(blank=True)
    
    def __str__(self):
        return f"Refund for {self.ticket_purchase.unique_id} - {self.status}"

class RevenueDistribution(models.Model):
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name="revenue_distribution")
    admin_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2)
    total_participants = models.IntegerField()
    admin_amount = models.DecimalField(max_digits=15, decimal_places=2)
    organizer_amount = models.DecimalField(max_digits=15, decimal_places=2)
    distributed_at = models.DateTimeField(auto_now_add=True)
    is_distributed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Revenue for {self.event.event_title}"
    
class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ("basic","Basic"),
        ("premium","Premium"),
    ]
    name = models.CharField(choices=PLAN_CHOICES)
    price = models.DecimalField(max_digits=6,decimal_places=2, default=0.00)
    event_join_limit = models.PositiveIntegerField(default=0)
    event_creation_limit = models.PositiveIntegerField(default=0)
    # features
    email_notification = models.BooleanField(default=False)
    group_chat = models.BooleanField(default=False)
    personal_chat = models.BooleanField(default=False)
    advanced_analytics = models.BooleanField(default=False)
    ticket_scanning = models.BooleanField(default=False)
    live_streaming = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.get_name_display()} Plan - {self.price}"
    
class UserSubscription(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="user_subscription")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    events_joined_current_month = models.PositiveIntegerField(default=0)
    events_organized_current_month = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name}" 
    
    def is_valid(self):
        return self.is_active and self.end_date > timezone.now()
    
    def can_join_event(self):
        return self.events_joined_current_month <= self.plan.event_join_limit
    
    def can_organize_event(self):
        return self.events_organized_current_month <= self.plan.event_creation_limit
    
    def inc_joined_count(self):
        self.events_joined_current_month += 1
        self.save()
        
    def inc_organized_count(self):
        self.events_organized_current_month += 1
        self.save()
        
    def days_remaining(self):
        if not self.is_valid():
            return 0
        print(self.end_date,'00000',self.end_date.date(),'8888',timezone.now().date())
        days = self.end_date.date() - timezone.now().date()
        return max(days.days,0)
    
class SubscriptionTransaction(models.Model):
    subscription = models.ForeignKey(UserSubscription, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=[
        ("purchase", "Purchase"),
        ("renewal", "Renewal"),
        ("upgrade", "Upgrade"),
    ])
    payment_method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.subscription.user.username} - ₹{self.amount}"