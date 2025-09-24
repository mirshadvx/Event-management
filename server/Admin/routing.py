from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/organizer/(?P<user_id>\d+)/$", consumers.OrganizerConsumer.as_asgi()),
]
