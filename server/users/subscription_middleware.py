from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve
from Admin.models import UserSubscription
import logging

logger = logging.getLogger(__name__)


class SubscriptionMiddleware(MiddlewareMixin):
 
    
    SUBSCRIPTION_REQUIRED_PATHS = [
        '/users/checkout/',
        '/event/create/',
        '/event/update/',
    ]
    
    EXCLUDED_PATHS = [
        '/users/subscription-checkout/',
        '/users/subscription-upgrade/',
        '/users/renew-subscription/',
        '/users/subscription-details/',
        '/admin/',
        '/users/token/',
        '/users/register/',
        '/users/logout/',
        '/users/authenticated/',
    ]

    def process_request(self, request):

        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
            
        path = request.path
        if any(path.startswith(excluded) for excluded in self.EXCLUDED_PATHS):
            return None
            
        if not path.startswith('/api/') and not any(path.startswith(p) for p in self.SUBSCRIPTION_REQUIRED_PATHS):
            return None
            
        requires_subscription = any(path.startswith(required_path) for required_path in self.SUBSCRIPTION_REQUIRED_PATHS)
        
        if requires_subscription:
            try:
                subscription = UserSubscription.objects.get(user=request.user, is_active=True)
                
                if subscription.is_expired():
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "Your subscription has expired. Please renew to continue using the service.",
                            "subscription_expired": True,
                            "expired_date": subscription.end_date.isoformat(),
                        },
                        status=403
                    )
                    
            except UserSubscription.DoesNotExist:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "You need an active subscription to access this feature.",
                        "subscription_required": True,
                    },
                    status=403
                )
                
        return None
