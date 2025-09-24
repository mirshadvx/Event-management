import logging
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
import jwt
from django.conf import settings
from users.models import Profile

logger = logging.getLogger(__name__)


class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = dict(x.split("=") for x in query_string.split("&") if x)
        token = query_params.get("token")

        if scope.get("user") and scope["user"].is_authenticated:
            return await super().__call__(scope, receive, send)

        if token:
            user = await self.get_user_from_token(token)
            if user:
                scope["user"] = user
            else:
                logger.warning(f"Invalid or expired token: {token}")
        else:
            logger.debug("No token provided in WebSocket connection")

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if user_id:
                return Profile.objects.get(id=user_id)
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
        except jwt.DecodeError:
            logger.error("Invalid token")
        except Profile.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
        return AnonymousUser()
