from django.urls import path
from .views import *

urlpatterns = [
    path('profile-data/',UserProfile.as_view(), name="profile_data"),
]
