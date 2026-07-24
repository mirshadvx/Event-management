from django.urls import path
from .views import (
    ManagedUserCreateView,
    ManagedUserDetailView,
    GuardLoginView,
    GuardLogoutView,
    GuardSessionView,
    GuardTicketScanHistoryView,
    GuardTicketVerifyView,
)

urlpatterns = [
    path('events/<int:event_id>/managed-users/', ManagedUserCreateView.as_view(), name='managed_user_list_create'),
    path('events/<int:event_id>/managed-users/<int:user_id>/', ManagedUserDetailView.as_view(), name='managed_user_detail'),
    path('event/<int:event_id>/guard/login/', GuardLoginView.as_view(), name="guard_login"),
    path('event/<int:event_id>/guard/me/', GuardSessionView.as_view(), name="guard_session"),
    path('event/<int:event_id>/guard/scans/', GuardTicketScanHistoryView.as_view(), name="guard_scan_history"),
    path('event/<int:event_id>/guard/verify-ticket/', GuardTicketVerifyView.as_view(), name="guard_verify_ticket"),
    path('event/guard/logout/', GuardLogoutView.as_view(), name="guard_logout"),
]
