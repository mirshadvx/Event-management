import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_management.settings')
django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from Admin.routing import websocket_urlpatterns as admin_websocket_urlpatterns
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from chat.middleware import TokenAuthMiddleware
from channels.routing import URLRouter

django_asgi_app = get_asgi_application()


combined_websocket_patterns = admin_websocket_urlpatterns + chat_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware(
        # AllowedHostsOriginValidator(
            URLRouter(combined_websocket_patterns)
        # )
    )
})