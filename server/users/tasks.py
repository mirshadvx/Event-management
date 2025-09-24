from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import date
import logging
from django.utils import timezone
from event.models import Event
from django.db import transaction
from decimal import Decimal
from Admin.models import RevenueDistribution
from users.models import WalletTransaction
from users.models import Profile
from users.filters import EventFilterDistribution
from chat.models import Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


@shared_task
def send_otp_email(email, otp):
    context = {
        "otp": otp,
        "current_date": date.today(),
    }
    html_message = render_to_string("email/otp_send.html", context)
    plain_message = strip_tags(html_message)
    send_mail(
        subject="Verify Your Email",
        message=plain_message,
        from_email=None,
        recipient_list=[email],
        fail_silently=False,
        html_message=html_message,
    )


@shared_task
def test_celery(test):
    # Simulate sending an email
    return f"testing{test}"


@shared_task
def distribute_event_revenue():
    logging.debug("distibute event revenuse is triggered", timezone.now())

    filter_data = {
        "revenue_distributed": False,
        "end_date__lt": timezone.now().date(),
        "is_published": True,
    }

    event_filter = EventFilterDistribution(filter_data, queryset=Event.objects.all())
    events = event_filter.qs

    for event in events:
        try:
            bookings = event.bookings.all()
            total_revenue = sum(booking.subtotal for booking in bookings)
            total_participants = event.total_tickets_sold()

            if total_participants < 100:
                admin_percentage = Decimal("5.00")
            elif total_participants < 200:
                admin_percentage = Decimal("7.00")
            elif total_participants < 500:
                admin_percentage = Decimal("10.00")
            else:
                admin_percentage = Decimal("15.00")

            admin_amount = (total_revenue * admin_percentage) / Decimal("100.00")
            organizer_amount = total_revenue - admin_amount

            Revenue = RevenueDistribution.objects.create(
                event=event,
                admin_percentage=admin_percentage,
                total_revenue=total_revenue,
                total_participants=total_participants,
                admin_amount=admin_amount,
                organizer_amount=organizer_amount,
                distributed_at=timezone.now(),
                is_distributed=True,
            )

            organizer_wallet = event.organizer.wallet
            organizer_wallet.balance += organizer_amount
            organizer_wallet.save()

            event.revenue_distributed = True
            event.save()

            WalletTransaction.objects.create(
                wallet=organizer_wallet,
                transaction_type="PAYMENT",
                amount=organizer_amount,
                description=f"Revenue distribution for {event.event_title}",
            )

            logger.info(
                f"Revenue distributed for {event.event_title}: "
                f"Admin: ₹{admin_amount}, Organizer: ₹{organizer_amount}"
            )

        except Exception as e:
            logger.error(
                f"Error distributing revenue for {event.event_title}: {str(e)}"
            )
            continue


@shared_task
def send_user_notification(user_id, message):
    try:
        user = Profile.objects.get(id=user_id)
        notification = Notification.objects.create(user=user, message=message)
        notification.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{user_id}",
            {
                "type": "send_notification",
                "id": notification.id,
                "message": message,
                "created_at": str(notification.created_at),
            },
        )
    except Profile.DoesNotExist:
        logger.error(f"user doen't exist {user_id}")
