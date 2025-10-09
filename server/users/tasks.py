from celery import shared_task
from django.utils import timezone
from Admin.models import UserSubscription
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_user_notification(user_id, message):
    """
    Send notification to user
    """
    try:
        from users.models import Profile
        from chat.models import Notification
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        import json
        
        user = Profile.objects.get(id=user_id)
        notification = Notification.objects.create(
            user=user,
            message=message
        )
        
        channel_layer = get_channel_layer()
        notification_group_name = f"notifications_{user_id}"
        
        logger.info(f"Sending WebSocket notification to group: {notification_group_name}")
        
        async_to_sync(channel_layer.group_send)(
            notification_group_name,
            {
                "type": "send_notification",
                "id": notification.id,
                "user": user.id,
                "message": notification.message,
                "created_at": notification.created_at.isoformat(),
            }
        )
        
        logger.info(f"WebSocket notification sent for notification ID: {notification.id}")
        
        logger.info(f"Notification sent to user {user_id}: {message}")
        return f"Notification sent to user {user_id}"
        
    except Exception as e:
        logger.error(f"Error sending notification to user {user_id}: {str(e)}")
        raise


@shared_task
def reset_monthly_subscription_counters():
    """
    Reset monthly counters for all active subscriptions
    This task should be run monthly via Celery Beat
    """
    try:
        active_subscriptions = UserSubscription.objects.filter(is_active=True)
        reset_count = 0
        
        for subscription in active_subscriptions:
            subscription.reset_monthly_counters()
            reset_count += 1
            
        logger.info(f"Reset monthly counters for {reset_count} subscriptions")
        return f"Successfully reset counters for {reset_count} subscriptions"
        
    except Exception as e:
        logger.error(f"Error resetting subscription counters: {str(e)}")
        raise


@shared_task
def check_expired_subscriptions():
    """
    Check and deactivate expired subscriptions
    """
    try:
        expired_subscriptions = UserSubscription.objects.filter(
            is_active=True,
            end_date__lt=timezone.now()
        )
        
        expired_count = 0
        for subscription in expired_subscriptions:
            subscription.is_active = False
            subscription.save()
            expired_count += 1
            
        logger.info(f"Deactivated {expired_count} expired subscriptions")
        return f"Successfully deactivated {expired_count} expired subscriptions"
        
    except Exception as e:
        logger.error(f"Error checking expired subscriptions: {str(e)}")
        raise


@shared_task
def test_celery(test):
    # Simulate sending an email
    return f"testing{test}"


@shared_task
def distribute_event_revenue():
    # This function will distribute revenue to organizers
    pass