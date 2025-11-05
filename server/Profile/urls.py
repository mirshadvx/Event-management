from django.urls import path
from .views import *

urlpatterns = [
    path("profile-data/", UserProfile.as_view(), name="profile_data"),
    path("search-users/", UserSearchView.as_view(), name="search_users"),
    path("toggle-follow/", FollowView.as_view(), name="toggle_follow"),
    path("follow-requests/", FollowRequestList.as_view(), name="follow_request_list"),
    path(
        "follow-requests/<int:pk>/",
        FollowRequestDetail.as_view(),
        name="follow_request_detail",
    ),
    path("<int:event_id>/review/", ReviewAPIView.as_view(), name="review-details"),
]
