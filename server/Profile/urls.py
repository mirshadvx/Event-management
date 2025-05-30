from django.urls import path
from .views import *

urlpatterns = [
    path('profile-data/',UserProfile.as_view(), name="profile_data"),
    path('toggle-follow/', FollowView.as_view(), name='toggle_follow'),
]
