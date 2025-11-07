import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "event_management.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from chat.socketio_server import socketio_app
from chat.middleware import TokenAuthMiddleware
from chat import routing as chat_routing
from event import routing as event_routing
from Admin import routing as admin_routing

django_asgi_app = get_asgi_application()


async def http_handler(scope, receive, send):
    path = scope.get("path", "")
    
    if path.startswith("/socket.io/"):
        await socketio_app(scope, receive, send)
    else:
        await django_asgi_app(scope, receive, send)


async def websocket_handler(scope, receive, send):
    import logging
    logger = logging.getLogger(__name__)
    path = scope.get("path", "")
    logger.info(f"[ASGI] WebSocket connection attempt for path: {path}")
    logger.info(f"[ASGI] WebSocket scope type: {scope.get('type')}")
    
    try:
        if path.startswith("/ws/webrtc/"):
            logger.info(f"[ASGI] Routing WebRTC connection to Django Channels")
            logger.info(f"[ASGI] Event routing patterns: {event_routing.websocket_urlpatterns}")
            
            try:
                middleware_stack = TokenAuthMiddleware(
                    URLRouter(event_routing.websocket_urlpatterns)
                )
                logger.info(f"[ASGI] Middleware stack created, calling...")
                await middleware_stack(scope, receive, send)
                logger.info(f"[ASGI] Middleware stack completed")
            except Exception as middleware_error:
                logger.error(f"[ASGI] Error in middleware/routing: {str(middleware_error)}", exc_info=True)
                if scope.get("type") == "websocket":
                    try:
                        await send({"type": "websocket.close", "code": 1011, "reason": str(middleware_error)})
                    except:
                        pass
                raise
        elif path.startswith("/ws/chat/") or path.startswith("/ws/notifications/") or path.startswith("/ws/organizer/"):
            logger.info(f"[ASGI] Routing chat/notification/organizer connection to Django Channels")
            middleware_stack = TokenAuthMiddleware(
                URLRouter(
                    chat_routing.websocket_urlpatterns + 
                    admin_routing.websocket_urlpatterns
                )
            )
            await middleware_stack(scope, receive, send)
        else:
            logger.info(f"[ASGI] Routing to Socket.io for path: {path}")
            await socketio_app(scope, receive, send)
    except Exception as e:
        if scope.get("type") == "websocket":
            try:
                await send({"type": "websocket.close", "code": 1011, "reason": str(e)})
            except Exception as send_error:
                logger.error(f"[ASGI] Error sending close message: {str(send_error)}")


application = ProtocolTypeRouter({
    "http": http_handler,
    "websocket": websocket_handler,
})
