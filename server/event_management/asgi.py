import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "event_management.settings")
django.setup()

from channels.routing import ProtocolTypeRouter
from django.core.asgi import get_asgi_application
from chat.socketio_server import socketio_app

django_asgi_app = get_asgi_application()


async def http_handler(scope, receive, send):
    """Handle HTTP requests, routing Socket.io to Socket.io app"""
    path = scope.get("path", "")
    
    if path.startswith("/socket.io/"):
        await socketio_app(scope, receive, send)
    else:
        await django_asgi_app(scope, receive, send)


application = ProtocolTypeRouter({
    "http": http_handler,
    "websocket": socketio_app,
})
