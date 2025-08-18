from django.urls import path
from .views import *

urlpatterns = [
    path('create-event/',EventCreateView.as_view(),name='event_create'),
    path('get-event/<int:event_id>/', GetEvent.as_view(), name='get-event'), 
    path('interact/<int:event_id>/', like_or_comment,name='like_or_comment'),
    path('preview-explore/', EventPreviewList.as_view(), name='event-preview-list'),
    path('preview-explore/<int:event_id>/', EventDetailViewExplore.as_view(), name='event-details-modal'),
    path('stream/create/', LiveStreamCreateView.as_view(), name='stream-create'),
    path('stream/<int:event_id>/', LiveStreamDetailView.as_view(), name='stream-detail'),
    path('stream/<int:event_id>/end/', LiveStreamDetailView.as_view(), name='stream-end'),
    path('booked-ticket-details/<uuid:booking_id>/', BookedTicketDetails.as_view(), name="booking-ticket-detials"),
]