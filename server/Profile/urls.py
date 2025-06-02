from django.urls import path
from .views import *

urlpatterns = [
    path('profile-data/',UserProfile.as_view(), name="profile_data"),
    path('toggle-follow/', FollowView.as_view(), name='toggle_follow'),
    path('<int:event_id>/review/', ReviewAPIView.as_view(), name="review-details"),
]
