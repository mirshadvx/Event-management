from celery import shared_task
from django.utils import timezone
from Admin.models import UserSubscription
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_user_notification(user_id, message):
    try:
        from users.models import Profile
        from chat.models import Notification
        from django.conf import settings
        import socketio
        
        user = Profile.objects.get(id=user_id)
        notification = Notification.objects.create(user=user, message=message)
        
        notification_data = {
            "id": notification.id,
            "user": user.id,
            "message": notification.message,
            "created_at": notification.created_at.isoformat(),
        }

        redis_host = getattr(settings, 'REDIS_HOST', 'redis')
        redis_port = getattr(settings, 'REDIS_PORT', 6379)
        redis_db = getattr(settings, 'REDIS_DB', 0)
        
        user_id_str = str(user_id)
        room_name = f"notifications_{user_id_str}"
        
        try:
            import redis
            import json
            
            redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=False
            )
            
            pub_message = {
                'room': room_name,
                'data': notification_data
            }
            
            redis_client.publish('socketio_notifications', json.dumps(pub_message))
            
            redis_client.close()
            
        except Exception as pub_error:
            logger.error(f"Error publishing notification to Redis: {str(pub_error)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
        
        return f"Notification sent to user {user_id}"

    except Exception as e:
        logger.error(f"Error sending notification to user {user_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise


@shared_task
def reset_monthly_subscription_counters():
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
    try:
        expired_subscriptions = UserSubscription.objects.filter(
            is_active=True, end_date__lt=timezone.now()
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
    return f"testing{test}"


@shared_task
def distribute_event_revenue():
    pass
