from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import SubscriptionPlan


@receiver(post_migrate)
def create_default_plans(sender, **kwargs):
    if sender.name == "Admin" or sender.label == "Admin":
        SubscriptionPlan.ensure_default_plans()
