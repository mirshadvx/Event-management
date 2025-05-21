import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import *
from django.core.exceptions import ObjectDoesNotExist

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'

        is_participant = await self.is_conversation_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.conversation_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'conversation_group_name'):
            await self.channel_layer.group_discard(self.conversation_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            if message_type == 'message':
                content = data.get('message')
                if not content or not content.strip():
                    await self.send(text_data=json.dumps({'error': 'Message cannot be empty'}))
                    return
                saved_message = await self.save_message(content)
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'chat_message',
                        'message': content,
                        'message_id': saved_message['id'],
                        'sender_id': self.user.id,
                        'sender_username': self.user.username,
                        'timestamp': saved_message['timestamp']
                    }
                )
            elif message_type == 'read':
                message_id = data.get('message_id')
                await self.mark_message_as_read(message_id)
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'message_read',
                        'message_id': message_id,
                        'user_id': self.user.id
                    }
                )
            elif message_type == 'typing':
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'typing',
                        'user_id': self.user.id,
                        'username': self.user.username
                    }
                )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'timestamp': event['timestamp']
       }))

    async def message_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read',
            'message_id': event['message_id'],
            'user_id': event['user_id']
        }))

    async def typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    @database_sync_to_async
    def is_conversation_participant(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )
        conversation.updated_at = message.timestamp
        conversation.save()
        return {
            'id': message.id,
            'timestamp': message.timestamp.isoformat()
        }

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id, conversation_id=self.conversation_id)
            if message.sender != self.user and not message.is_read:
                message.is_read = True
                message.save()
        except Message.DoesNotExist:
            pass
        
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'

        is_participant = await self.is_conversation_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.conversation_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'conversation_group_name'):
            await self.channel_layer.group_discard(self.conversation_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            if message_type == 'message':
                content = data.get('message')
                if not content or not content.strip():
                    await self.send(text_data=json.dumps({'error': 'Message cannot be empty'}))
                    return
                saved_message = await self.save_message(content)
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'chat_message',
                        'message': content,
                        'message_id': saved_message['id'],
                        'sender_id': self.user.id,
                        'sender_username': self.user.username,
                        'timestamp': saved_message['timestamp']
                    }
                )
            elif message_type == 'read':
                message_id = data.get('message_id')
                await self.mark_message_as_read(message_id)
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'message_read',
                        'message_id': message_id,
                        'user_id': self.user.id
                    }
                )
            elif message_type == 'typing':
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'typing',
                        'user_id': self.user.id,
                        'username': self.user.username
                    }
                )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'timestamp': event['timestamp']
       }))

    async def message_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read',
            'message_id': event['message_id'],
            'user_id': event['user_id']
        }))

    async def typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    @database_sync_to_async
    def is_conversation_participant(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )
        conversation.updated_at = message.timestamp
        conversation.save()
        return {
            'id': message.id,
            'timestamp': message.timestamp.isoformat()
        }

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id, conversation_id=self.conversation_id)
            if message.sender != self.user and not message.is_read:
                message.is_read = True
                message.save()
        except Message.DoesNotExist:
            pass


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.group_name = f'group_chat_{self.group_id}'

        is_participant = await self.is_group_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            if message_type == 'message':
                content = data.get('message')
                if not content or not content.strip():
                    await self.send(text_data=json.dumps({'error': 'Message cannot be empty'}))
                    return
                saved_message = await self.save_message(content)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'group_message',
                        'message': content,
                        'message_id': saved_message['id'],
                        'sender_id': self.user.id,
                        'sender_username': self.user.username,
                        'timestamp': saved_message['timestamp']
                    }
                )
            elif message_type == 'read':
                message_id = data.get('message_id')
                await self.mark_message_as_read(message_id)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'message_read',
                        'message_id': message_id,
                        'user_id': self.user.id
                    }
                )
            elif message_type == 'typing':
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'typing',
                        'user_id': self.user.id,
                        'username': self.user.username
                    }
                )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def group_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'timestamp': event['timestamp']
       }))

    async def message_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read',
            'message_id': event['message_id'],
            'user_id': event['user_id']
        }))

    async def typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    @database_sync_to_async
    def is_group_participant(self):
        try:
            group = GroupConversation.objects.get(id=self.group_id)
            return group.participants.filter(id=self.user.id).exists()
        except GroupConversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        group = GroupConversation.objects.get(id=self.group_id)
        message = GroupMessage.objects.create(
            conversation=group,
            sender=self.user,
            content=content )
        message.read_by.add(self.user)
        group.updated_at = message.timestamp
        group.save()
        return {
            'id': message.id,
            'timestamp': message.timestamp.isoformat()
        }

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        try:
            message = GroupMessage.objects.get(id=message_id, conversation_id=self.group_id)
            if message.sender != self.user and not message.read_by.filter(id=self.user.id).exists():
                message.read_by.add(self.user)
        except GroupMessage.DoesNotExist:
            pass
        

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id = self.scope['url_route']['kwargs']['user_id']

        if str(self.user.id) != self.user_id:
            await self.close(code=4001)
            return

        self.notification_group_name = f'notifications_{self.user_id}'

        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'id': event['id'],
            'message': event['message'],
            'created_at': event['created_at']
        }))
