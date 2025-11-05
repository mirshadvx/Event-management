from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from Admin.models import UserSubscription, SubscriptionPlan, SubscriptionTransaction
from users.models import Profile
from users.serializers import (
    UserPlanDetailsSerializer,
    SubscriptionTransactionSerializer,
)
import logging

logger = logging.getLogger(__name__)


class AdminSubscriptionStats(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get subscription statistics for admin dashboard"""
        try:
            if not request.user.is_staff:
                return Response(
                    {"success": False, "message": "Admin access required"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Calculate stats
            total_subscriptions = UserSubscription.objects.count()
            active_subscriptions = UserSubscription.objects.filter(
                is_active=True
            ).count()
            expired_subscriptions = UserSubscription.objects.filter(
                is_active=True, end_date__lt=timezone.now()
            ).count()

            # Revenue calculations
            total_revenue = (
                SubscriptionTransaction.objects.aggregate(total=Sum("amount"))["total"]
                or 0
            )

            # Monthly revenue (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            monthly_revenue = (
                SubscriptionTransaction.objects.filter(
                    transaction_date__gte=thirty_days_ago
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )

            stats = {
                "total_subscriptions": total_subscriptions,
                "active_subscriptions": active_subscriptions,
                "expired_subscriptions": expired_subscriptions,
                "total_revenue": float(total_revenue),
                "monthly_revenue": float(monthly_revenue),
            }

            return Response(
                {
                    "success": True,
                    "stats": stats,
                }
            )

        except Exception as e:
            logger.error(f"Error fetching subscription stats: {str(e)}")
            return Response(
                {"success": False, "message": "An error occurred while fetching stats"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminRecentSubscriptions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get recent subscriptions for admin dashboard"""
        try:
            if not request.user.is_staff:
                return Response(
                    {"success": False, "message": "Admin access required"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            recent_subscriptions = UserSubscription.objects.select_related(
                "user", "plan"
            ).order_by("-start_date")[:10]

            subscriptions_data = []
            for subscription in recent_subscriptions:
                subscriptions_data.append(
                    {
                        "id": subscription.id,
                        "user": subscription.user.username,
                        "plan": {
                            "name": subscription.plan.name,
                            "price": float(subscription.plan.price),
                        },
                        "is_active": subscription.is_active,
                        "start_date": subscription.start_date,
                        "end_date": subscription.end_date,
                    }
                )

            return Response(
                {
                    "success": True,
                    "subscriptions": subscriptions_data,
                }
            )

        except Exception as e:
            logger.error(f"Error fetching recent subscriptions: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while fetching subscriptions",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminResetSubscriptionCounters(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Reset monthly counters for all subscriptions"""
        try:
            if not request.user.is_staff:
                return Response(
                    {"success": False, "message": "Admin access required"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            active_subscriptions = UserSubscription.objects.filter(is_active=True)
            reset_count = 0

            for subscription in active_subscriptions:
                subscription.reset_monthly_counters()
                reset_count += 1

            logger.info(
                f"Admin {request.user.username} reset counters for {reset_count} subscriptions"
            )

            return Response(
                {
                    "success": True,
                    "message": f"Successfully reset counters for {reset_count} subscriptions",
                    "reset_count": reset_count,
                }
            )

        except Exception as e:
            logger.error(f"Error resetting subscription counters: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while resetting counters",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
