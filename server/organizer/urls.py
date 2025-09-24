from django.urls import path
from .views import *

urlpatterns = [
    path("organized-list/", OrganizedList.as_view(), name="organized_list"),
    path("user-details/", UserProfileDetails.as_view(), name="user_details"),
    path("participated-list/", ParticipatedList.as_view(), name="participated_list"),
    path(
        "event-ongoing/<int:event_id>/",
        EventOngoingData.as_view(),
        name="event-ongoing-data",
    ),
    path(
        "revenue-event/<int:event_id>/",
        RevenueEvent.as_view(),
        name="organized-event-complete-data",
    ),
]
