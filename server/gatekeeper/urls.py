from django.urls import path
from .views import ManagedUserCreateView, ManagedUserDetailView

urlpatterns = [
    path('events/<int:event_id>/managed-users/', ManagedUserCreateView.as_view(), name='managed-user-list-create'),
    path('events/<int:event_id>/managed-users/<int:user_id>/', ManagedUserDetailView.as_view(), name='managed-user-detail'),
]