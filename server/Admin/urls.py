from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (admin_login,OrganizerRequestList,
    OrganizerRequestUpdateStatus,
    OrganizerRequestBulkUpdate,
    OrganizerRequestUserDetails,
    UserListView, UserUpdateStatusView, UserBulkUpdateStatusView, CouponList,
    CouponDetail, CouponBulkUpdateStatus, BadgeListCreateView, BadgeDetailView, UserBadgeListView,
    RevenueDistributionListView, RevenueSummaryView, TransactionHistoryListView, RefundHistoryListView,
    SubscriptionPlanViewset, UserSubscriptionListView, UserSubscriptionStatus, SubscriptionAnalyticsView)

router = DefaultRouter()
router.register(r'subscription-plans', SubscriptionPlanViewset, basename='subscription-plan')

urlpatterns = [
    path('login/', admin_login, name="admin_login"),
    path('organizer/organizer-requests/', OrganizerRequestList.as_view(), name='organizer-requests-list'),
    path('organizer/organizer-requests/<int:pk>/update_status/', OrganizerRequestUpdateStatus.as_view(), name='organizer-requests-update-status'),
    path('organizer/organizer-requests/bulk_update/', OrganizerRequestBulkUpdate.as_view(), name='organizer-requests-bulk-update'),
    path('organizer/organizer-requests/<int:pk>/user_details/', OrganizerRequestUserDetails.as_view(), name='organizer-requests-user-details'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/update_status/', UserUpdateStatusView.as_view(), name='user-update-status'),
    path('users/bulk_update/', UserBulkUpdateStatusView.as_view(), name='user-bulk-update'),
    # coupons
    path('coupons/', CouponList.as_view(),name='coupons'),
    path('coupons/<int:pk>/', CouponDetail.as_view(), name='coupon-detail'),
    path('coupons/bulk_update/', CouponBulkUpdateStatus.as_view(), name='coupon-bulk-update'),
    # badge
    path('badges/', BadgeListCreateView.as_view(), name='badge-list-create'),
    path('badges/<int:pk>/', BadgeDetailView.as_view(), name='badge-detail'),
    path('user-badges/', UserBadgeListView.as_view(), name='user-badge-list'),
    path('revenue-distributions/', RevenueDistributionListView.as_view(), name='revenue-distribution-list'),
    path('revenue-summary/', RevenueSummaryView.as_view(), name='revenue-summary'),
    path('transaction-history/', TransactionHistoryListView.as_view(), name='transaction-history'),
    path('refund-history/', RefundHistoryListView.as_view(), name='refund-history'),
    path('', include(router.urls)),
    path('subscriptions-users/', UserSubscriptionListView.as_view(), name='user-subscription-list'),
    path('subscriptions-users/<int:pk>/status/', UserSubscriptionStatus, name='Status-subscription-control'),
    path('subscriptions-analytics/', SubscriptionAnalyticsView.as_view(), name='subscriptions-analytics'),
]