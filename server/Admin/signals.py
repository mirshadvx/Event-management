from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import SubscriptionPlan

@receiver(post_migrate)
def create_default_plans(sender, **kwargs):
    SubscriptionPlan.ensure_default_plans()