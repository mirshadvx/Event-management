from django.urls import path
from .views import (EventCreateView, EventPreviewList, EventDetailViewExplore,
                    like_or_comment)

urlpatterns = [
    path('create-event/',EventCreateView.as_view(),name='event_create'),
    path('preview-explore/', EventPreviewList.as_view(), name='event-preview-list'),
    path('preview-explore/<int:event_id>/', EventDetailViewExplore.as_view(), name='event-details-modal'),
    path('interact/<int:event_id>/', like_or_comment,name='like_or_comment'),
]
