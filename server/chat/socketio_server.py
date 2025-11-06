import socketio
import logging
from django.contrib.auth.models import AnonymousUser
import jwt
from django.conf import settings
from users.models import Profile
from .models import Conversation, Message, GroupConversation, GroupMessage
import cloudinary.uploader
from asgiref.sync import sync_to_async
import redis
import json
import asyncio
import threading

logger = logging.getLogger(__name__)

redis_host = getattr(settings, 'REDIS_HOST', 'redis')
redis_port = getattr(settings, 'REDIS_PORT', 6379)
redis_db = getattr(settings, 'REDIS_DB', 0)

redis_url = f'redis://{redis_host}:{redis_port}/{redis_db}'

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
    client_timeout=60,
)

socketio_app = socketio.ASGIApp(sio)

redis_client = None
redis_pubsub = None
redis_listener_task = None
main_event_loop = None

def _redis_listener_thread():
    try:
        # Create Redis client (sync, in thread)
        r = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            decode_responses=True
        )
        
        r.ping()
        logger.info("Redis notification listener connected")
        
        pubsub = r.pubsub()
        
        pubsub.subscribe('socketio_notifications')
        
        for message in pubsub.listen():
            if message['type'] == 'message':
                try:
                    data = json.loads(message['data'])
                    
                    room_name = data.get('room')
                    notification_data = data.get('data')
                    
                    if room_name and notification_data and main_event_loop:
                        # Schedule async emit in the main event loop
                        future = asyncio.run_coroutine_threadsafe(
                            sio.emit('notification', notification_data, room=room_name),
                            main_event_loop
                        )
                        try:
                            future.result(timeout=5.0)
                        except Exception as emit_error:
                            logger.error(f"Error emitting notification to room {room_name}: {str(emit_error)}")
                    else:
                        if not main_event_loop:
                            logger.warning("Main event loop not available, cannot emit notification")
                        else:
                            logger.warning(f"Invalid notification format: {data}")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse notification JSON: {str(e)}")
                except Exception as e:
                    logger.error(f"Error processing notification: {str(e)}")
                    import traceback
                    logger.error(traceback.format_exc())
                    
    except Exception as e:
        logger.error(f"Redis listener thread failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

async def setup_redis_listener():
    global redis_listener_task, main_event_loop
    
    try:
        main_event_loop = asyncio.get_event_loop()
        
        listener_thread = threading.Thread(target=_redis_listener_thread, daemon=True)
        listener_thread.start()
        redis_listener_task = listener_thread
        
    except Exception as e:
        logger.error(f"Failed to set up Redis listener: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


def get_user_from_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id:
            return Profile.objects.get(id=user_id)
    except (jwt.ExpiredSignatureError, jwt.DecodeError, Profile.DoesNotExist) as e:
        logger.error(f"Token error: {str(e)}")
    return AnonymousUser()


@sio.event
async def connect(sid, environ, auth):
    try:
        query_string = environ.get('QUERY_STRING', '')
        query_params = {}
        if query_string:
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    query_params[key] = value
        
        token = query_params.get('token') or (auth.get('token') if auth else None)
        
        if not token:
            logger.warning("No token provided in Socket.IO connection")
            return False
        
        user = await sync_to_async(get_user_from_token)(token)
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            logger.warning(f"Unauthenticated connection attempt from {sid}")
            return False
        await sio.save_session(sid, {'user_id': user.id, 'user': user})
        
        global redis_listener_task
        if redis_listener_task is None or (redis_listener_task and not redis_listener_task.is_alive()):
            try:
                await setup_redis_listener()
            except Exception as e:
                logger.error(f"Failed to start Redis listener: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
        
        return True
    except Exception as e:
        logger.error(f"Error in Socket.IO connect: {str(e)}")
        return False


@sio.event
async def disconnect(sid):
    pass


@sio.event
async def join_chat(sid, data):
    try:
        session = await sio.get_session(sid)
        user = session.get('user')
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            await sio.emit('error', {'message': 'Unauthorized'}, room=sid)
            return
        
        chat_type = data.get('chat_type')
        chat_id = data.get('chat_id')
        
        if not chat_type or not chat_id:
            await sio.emit('error', {'message': 'Invalid chat parameters'}, room=sid)
            return
        try:
            chat_id = int(chat_id)
        except (ValueError, TypeError):
            await sio.emit('error', {'message': 'Invalid chat_id'}, room=sid)
            return
        
        if chat_type == 'personal':
            is_participant = await sync_to_async(is_conversation_participant)(chat_id, user.id)
        elif chat_type == 'group':
            is_participant = await sync_to_async(is_group_participant)(chat_id, user.id)
        else:
            await sio.emit('error', {'message': 'Invalid chat type'}, room=sid)
            return
        
        if not is_participant:
            await sio.emit('error', {'message': 'Not a participant'}, room=sid)
            return
        
        room_name = f"{chat_type}_chat_{chat_id}"
        await sio.enter_room(sid, room_name)
        await sio.save_session(sid, {**session, 'chat_type': chat_type, 'chat_id': chat_id, 'room_name': room_name})
        await sio.emit('joined', {'room': room_name}, room=sid)
    except Exception as e:
        logger.error(f"Error joining chat: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def leave_chat(sid, data):
    session = await sio.get_session(sid)
    room_name = session.get('room_name')
    
    if room_name:
        await sio.leave_room(sid, room_name)
        await sio.save_session(sid, {**session, 'chat_type': None, 'chat_id': None, 'room_name': None})


@sio.event
async def send_message(sid, data):
    try:
        session = await sio.get_session(sid)
        user = session.get('user')
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            await sio.emit('error', {'message': 'Unauthorized'}, room=sid)
            return
        
        chat_type = session.get('chat_type')
        chat_id = session.get('chat_id')
        room_name = session.get('room_name')
        
        if not chat_type or not chat_id or not room_name:
            await sio.emit('error', {'message': 'Not in a chat room'}, room=sid)
            return
        
        content = data.get('message')
        if not content or not content.strip():
            await sio.emit('error', {'message': 'Message cannot be empty'}, room=sid)
            return
        
        if chat_type == 'personal':
            saved_message = await sync_to_async(save_message)(chat_id, user.id, content)
        elif chat_type == 'group':
            saved_message = await sync_to_async(save_group_message)(chat_id, user.id, content)
        else:
            await sio.emit('error', {'message': 'Invalid chat type'}, room=sid)
            return
        
        message_data = {
            'type': 'message',
            'message_id': saved_message['id'],
            'message': content,
            'sender_id': user.id,
            'sender_username': user.username,
            'timestamp': saved_message['timestamp'],
            'is_image': False,
        }
        
        await sio.emit('message', message_data, room=room_name)
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def send_image(sid, data):
    try:
        session = await sio.get_session(sid)
        user = session.get('user')
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            await sio.emit('error', {'message': 'Unauthorized'}, room=sid)
            return
        
        chat_type = session.get('chat_type')
        chat_id = session.get('chat_id')
        room_name = session.get('room_name')
        
        if not chat_type or not chat_id or not room_name:
            await sio.emit('error', {'message': 'Not in a chat room'}, room=sid)
            return
        
        image_data = data.get('image')
        if not image_data:
            await sio.emit('error', {'message': 'Image data cannot be empty'}, room=sid)
            return
        
        if chat_type == 'personal':
            saved_message = await sync_to_async(save_image_message)(chat_id, user.id, image_data)
        elif chat_type == 'group':
            saved_message = await sync_to_async(save_group_image_message)(chat_id, user.id, image_data)
        else:
            await sio.emit('error', {'message': 'Invalid chat type'}, room=sid)
            return
        
        message_data = {
            'type': 'image',
            'message_id': saved_message['id'],
            'image_url': saved_message['image_url'],
            'sender_id': user.id,
            'sender_username': user.username,
            'timestamp': saved_message['timestamp'],
            'is_image': True,
        }
        
        await sio.emit('image', message_data, room=room_name)
    except Exception as e:
        logger.error(f"Error sending image: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def mark_read(sid, data):
    try:
        session = await sio.get_session(sid)
        user = session.get('user')
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            return
        
        chat_type = session.get('chat_type')
        chat_id = session.get('chat_id')
        room_name = session.get('room_name')
        message_id = data.get('message_id')
        
        if not chat_type or not chat_id or not message_id:
            return
        
        if chat_type == 'personal':
            await sync_to_async(mark_message_as_read)(chat_id, user.id, message_id)
        elif chat_type == 'group':
            await sync_to_async(mark_group_message_as_read)(chat_id, user.id, message_id)
        
        await sio.emit('read', {
            'type': 'read',
            'message_id': message_id,
            'user_id': user.id,
        }, room=room_name)
    except Exception as e:
        logger.error(f"Error marking message as read: {str(e)}")


@sio.event
async def typing(sid, data):
    try:
        session = await sio.get_session(sid)
        user = session.get('user')
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            return
        
        room_name = session.get('room_name')
        
        if room_name:
            await sio.emit('typing', {
                'type': 'typing',
                'user_id': user.id,
                'username': user.username,
            }, room=room_name)
    except Exception as e:
        logger.error(f"Error handling typing: {str(e)}")


@sio.event
async def join_notifications(sid, data):
    try:
        session = await sio.get_session(sid)
        user = session.get('user')
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            logger.warning(f"Unauthorized attempt to join notifications room: {sid}")
            await sio.emit('error', {'message': 'Unauthorized'}, room=sid)
            return
        
        user_id = data.get('user_id')
        
        if not user_id:
            logger.warning(f"Missing user_id in join_notifications: {sid}")
            await sio.emit('error', {'message': 'Missing user_id'}, room=sid)
            return
        
        if str(user.id) != str(user_id):
            logger.warning(f"User ID mismatch: session user {user.id} != requested {user_id}")
            await sio.emit('error', {'message': 'Unauthorized'}, room=sid)
            return
        
        room_name = f"notifications_{user_id}"
        await sio.enter_room(sid, room_name)
        await sio.save_session(sid, {**session, 'notification_room': room_name})
        
        await sio.emit('notifications_joined', {'room': room_name}, room=sid)
    except Exception as e:
        logger.error(f"Error joining notifications: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        await sio.emit('error', {'message': str(e)}, room=sid)




@sio.event
async def join_organizer(sid, data):
    try:
        session = await sio.get_session(sid)
        user_id = data.get('user_id')
        
        if not user_id:
            await sio.emit('error', {'message': 'Invalid user_id'}, room=sid)
            return
        
        room_name = f"organizer_{user_id}"
        await sio.enter_room(sid, room_name)
        await sio.save_session(sid, {**session, 'organizer_room': room_name})
        await sio.emit('organizer_joined', {'room': room_name}, room=sid)
    except Exception as e:
        logger.error(f"Error joining organizer room: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)


def is_conversation_participant(chat_id, user_id):
    try:
        conversation = Conversation.objects.get(id=chat_id)
        return conversation.participants.filter(id=user_id).exists()
    except Conversation.DoesNotExist:
        return False


def is_group_participant(chat_id, user_id):
    try:
        group = GroupConversation.objects.get(id=chat_id)
        return group.participants.filter(id=user_id).exists()
    except GroupConversation.DoesNotExist:
        return False


def save_message(chat_id, user_id, content):
    user = Profile.objects.get(id=user_id)
    conversation = Conversation.objects.get(id=chat_id)
    message = Message.objects.create(
        conversation=conversation, sender=user, content=content
    )
    conversation.updated_at = message.timestamp
    conversation.save()
    return {"id": message.id, "timestamp": message.timestamp.isoformat()}


def save_group_message(chat_id, user_id, content):
    user = Profile.objects.get(id=user_id)
    group = GroupConversation.objects.get(id=chat_id)
    message = GroupMessage.objects.create(
        conversation=group, sender=user, content=content
    )
    message.read_by.add(user)
    group.updated_at = message.timestamp
    group.save()
    return {"id": message.id, "timestamp": message.timestamp.isoformat()}


def save_image_message(chat_id, user_id, image_data):
    user = Profile.objects.get(id=user_id)
    conversation = Conversation.objects.get(id=chat_id)
    try:
        upload_result = cloudinary.uploader.upload(
            image_data, resource_type="image"
        )
        image_url = upload_result["secure_url"]
        message = Message.objects.create(
            conversation=conversation,
            sender=user,
            content=image_url,
            is_image=True,
        )
        conversation.updated_at = message.timestamp
        conversation.save()
        return {
            "id": message.id,
            "image_url": image_url,
            "timestamp": message.timestamp.isoformat(),
        }
    except Exception as e:
        raise Exception(f"Image upload failed: {str(e)}")


def save_group_image_message(chat_id, user_id, image_data):
    user = Profile.objects.get(id=user_id)
    group = GroupConversation.objects.get(id=chat_id)
    try:
        upload_result = cloudinary.uploader.upload(
            image_data, resource_type="image"
        )
        image_url = upload_result["secure_url"]
        message = GroupMessage.objects.create(
            conversation=group, sender=user, content=image_url, is_image=True
        )
        message.read_by.add(user)
        group.updated_at = message.timestamp
        group.save()
        return {
            "id": message.id,
            "image_url": image_url,
            "timestamp": message.timestamp.isoformat(),
        }
    except Exception as e:
        raise Exception(f"Image upload failed: {str(e)}")


def mark_message_as_read(chat_id, user_id, message_id):
    try:
        user = Profile.objects.get(id=user_id)
        message = Message.objects.get(id=message_id, conversation_id=chat_id)
        if message.sender != user and not message.read:
            message.read = True
            message.save()
    except (Message.DoesNotExist, Profile.DoesNotExist):
        pass


def mark_group_message_as_read(chat_id, user_id, message_id):
    try:
        user = Profile.objects.get(id=user_id)
        message = GroupMessage.objects.get(
            id=message_id, conversation_id=chat_id
        )
        if (
            message.sender != user
            and not message.read_by.filter(id=user.id).exists()
        ):
            message.read_by.add(user)
    except GroupMessage.DoesNotExist:
        pass


async def send_notification_to_user(user_id, notification_data):
    try:
        user_id_str = str(user_id)
        room_name = f"notifications_{user_id_str}"
        logger.info(f"Emitting notification to room: {room_name}, data: {notification_data}")
        await sio.emit('notification', notification_data, room=room_name)
        logger.info(f"Notification emitted successfully to room: {room_name}")
    except Exception as e:
        logger.error(f"Error sending notification to user {user_id}: {str(e)}")
        raise


async def send_status_update_to_organizer(user_id, status_data):
    room_name = f"notifications_{user_id}"
    await sio.emit('organizer_status_update', status_data, room=room_name)

