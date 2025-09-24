from django.db.models.signals import post_save
from django.dispatch import receiver
from event.models import Ticket, Event, TicketPurchase
from users.models import Booking
from services.badge_service import check_and_assign_badges


@receiver(post_save, sender=Booking)
def ticket_purchase(sender, instance, created, **kwargs):
    if created:
        check_and_assign_badges(instance.user)


@receiver(post_save, sender=Event)
def check_after_event_creation(sender, instance, created, **kwargs):
    if created:
        check_and_assign_badges(instance.organizer)
