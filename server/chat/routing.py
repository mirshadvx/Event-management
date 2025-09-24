from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(
        r"ws/chat/(?P<chat_type>\w+)/(?P<chat_id>\d+)/$",
        consumers.ChatConsumer.as_asgi(),
    ),
    re_path(
        r"ws/notifications/(?P<user_id>\d+)/$", consumers.NotificationConsumer.as_asgi()
    ),
]
