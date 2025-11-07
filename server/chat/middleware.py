import logging
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from users.models import Profile

logger = logging.getLogger(__name__)


class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        
        query_string = scope.get("query_string", b"").decode()
        query_params = dict(x.split("=") for x in query_string.split("&") if x)
        token = query_params.get("token")

        if scope.get("user") and scope["user"].is_authenticated:
            return await super().__call__(scope, receive, send)

        if token:
            user = await self.get_user_from_token(token)
            if user and user.is_authenticated:
                scope["user"] = user
            else:
                logger.warning(f"[TokenAuthMiddleware] Invalid or expired token")
        else:
            logger.warning(f"[TokenAuthMiddleware] No token provided in WebSocket connection for path: {path}")

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token.get("user_id")
            if user_id:
                try:
                    user = Profile.objects.get(id=user_id)
                    logger.info(f"[TokenAuthMiddleware] User found: {user.id} ({user.username})")
                    return user
                except Profile.DoesNotExist:
                    logger.error(f"[TokenAuthMiddleware] User with ID {user_id} does not exist")
                    return AnonymousUser()
            else:
                logger.warning(f"[TokenAuthMiddleware] No user_id in token")
                return AnonymousUser()
        except TokenError as e:
            logger.error(f"[TokenAuthMiddleware] Token error: {str(e)}")
        except Exception as e:
            logger.error(f"[TokenAuthMiddleware] Unexpected error validating token: {str(e)}", exc_info=True)
        return AnonymousUser()
