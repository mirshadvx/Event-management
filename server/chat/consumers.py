import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import *
from django.core.exceptions import ObjectDoesNotExist
import cloudinary.uploader


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.chat_type = self.scope["url_route"]["kwargs"]["chat_type"]
        self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]

        if self.chat_type == "personal":
            self.chat_group_name = f"personal_chat_{self.chat_id}"
            is_participant = await self.is_conversation_participant()
        elif self.chat_type == "group":
            self.chat_group_name = f"group_chat_{self.chat_id}"
            is_participant = await self.is_group_participant()
        else:
            await self.close(code=4000)
            return

        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.chat_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "chat_group_name"):
            await self.channel_layer.group_discard(
                self.chat_group_name, self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type", "message")

            if message_type == "message":
                content = data.get("message")
                if not content or not content.strip():
                    await self.send(
                        text_data=json.dumps({"error": "Message cannot be empty"})
                    )
                    return

                if self.chat_type == "personal":
                    saved_message = await self.save_message(content)
                    event_type = "chat_message"
                elif self.chat_type == "group":
                    saved_message = await self.save_group_message(content)
                    event_type = "group_message"

                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        "type": event_type,
                        "message": content,
                        "message_id": saved_message["id"],
                        "sender_id": self.user.id,
                        "sender_username": self.user.username,
                        "timestamp": saved_message["timestamp"],
                        "is_image": False,
                    },
                )
            elif message_type == "image":
                image_data = data.get("image")
                if not image_data:
                    await self.send(
                        text_data=json.dumps({"error": "Image data cannot be empty"})
                    )
                    return

                if self.chat_type == "personal":
                    saved_message = await self.save_image_message(image_data)
                    event_type = "chat_image"
                elif self.chat_type == "group":
                    saved_message = await self.save_group_image_message(image_data)
                    event_type = "group_image"

                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        "type": event_type,
                        "image_url": saved_message["image_url"],
                        "message_id": saved_message["id"],
                        "sender_id": self.user.id,
                        "sender_username": self.user.username,
                        "timestamp": saved_message["timestamp"],
                        "is_image": True,
                    },
                )
            elif message_type == "read":
                message_id = data.get("message_id")
                if self.chat_type == "personal":
                    await self.mark_message_as_read(message_id)
                elif self.chat_type == "group":
                    await self.mark_group_message_as_read(message_id)

                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        "type": "message_read",
                        "message_id": message_id,
                        "user_id": self.user.id,
                    },
                )
            elif message_type == "typing":
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        "type": "typing",
                        "user_id": self.user.id,
                        "username": self.user.username,
                    },
                )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"error": "Invalid JSON"}))
        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "message_id": event["message_id"],
                    "message": event["message"],
                    "sender_id": event["sender_id"],
                    "sender_username": event["sender_username"],
                    "timestamp": event["timestamp"],
                    "is_image": event["is_image"],
                }
            )
        )

    async def group_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "message_id": event["message_id"],
                    "message": event["message"],
                    "sender_id": event["sender_id"],
                    "sender_username": event["sender_username"],
                    "timestamp": event["timestamp"],
                    "is_image": event["is_image"],
                }
            )
        )

    async def chat_image(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "image",
                    "message_id": event["message_id"],
                    "image_url": event["image_url"],
                    "sender_id": event["sender_id"],
                    "sender_username": event["sender_username"],
                    "timestamp": event["timestamp"],
                    "is_image": event["is_image"],
                }
            )
        )

    async def group_image(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "image",
                    "message_id": event["message_id"],
                    "image_url": event["image_url"],
                    "sender_id": event["sender_id"],
                    "sender_username": event["sender_username"],
                    "timestamp": event["timestamp"],
                    "is_image": event["is_image"],
                }
            )
        )

    async def message_read(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "read",
                    "message_id": event["message_id"],
                    "user_id": event["user_id"],
                }
            )
        )

    async def typing(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "typing",
                    "user_id": event["user_id"],
                    "username": event["username"],
                }
            )
        )

    @database_sync_to_async
    def is_conversation_participant(self):
        try:
            conversation = Conversation.objects.get(id=self.chat_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def is_group_participant(self):
        try:
            group = GroupConversation.objects.get(id=self.chat_id)
            return group.participants.filter(id=self.user.id).exists()
        except GroupConversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        conversation = Conversation.objects.get(id=self.chat_id)
        message = Message.objects.create(
            conversation=conversation, sender=self.user, content=content
        )
        conversation.updated_at = message.timestamp
        conversation.save()
        return {"id": message.id, "timestamp": message.timestamp.isoformat()}

    @database_sync_to_async
    def save_group_message(self, content):
        group = GroupConversation.objects.get(id=self.chat_id)
        message = GroupMessage.objects.create(
            conversation=group, sender=self.user, content=content
        )
        message.read_by.add(self.user)
        group.updated_at = message.timestamp
        group.save()
        return {"id": message.id, "timestamp": message.timestamp.isoformat()}

    @database_sync_to_async
    def save_image_message(self, image_data):
        conversation = Conversation.objects.get(id=self.chat_id)
        try:
            upload_result = cloudinary.uploader.upload(
                image_data, resource_type="image"
            )
            image_url = upload_result["secure_url"]
            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
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

    @database_sync_to_async
    def save_group_image_message(self, image_data):
        group = GroupConversation.objects.get(id=self.chat_id)
        try:
            upload_result = cloudinary.uploader.upload(
                image_data, resource_type="image"
            )
            image_url = upload_result["secure_url"]
            message = GroupMessage.objects.create(
                conversation=group, sender=self.user, content=image_url, is_image=True
            )
            message.read_by.add(self.user)
            group.updated_at = message.timestamp
            group.save()
            return {
                "id": message.id,
                "image_url": image_url,
                "timestamp": message.timestamp.isoformat(),
            }
        except Exception as e:
            raise Exception(f"Image upload failed: {str(e)}")

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id, conversation_id=self.chat_id)
            if message.sender != self.user and not message.read:
                message.read = True
                message.save()
        except Message.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_group_message_as_read(self, message_id):
        try:
            message = GroupMessage.objects.get(
                id=message_id, conversation_id=self.chat_id
            )
            if (
                message.sender != self.user
                and not message.read_by.filter(id=self.user.id).exists()
            ):
                message.read_by.add(self.user)
        except GroupMessage.DoesNotExist:
            pass


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id = self.scope["url_route"]["kwargs"]["user_id"]

        if str(self.user.id) != self.user_id:
            await self.close(code=4001)
            return

        self.notification_group_name = f"notifications_{self.user_id}"

        await self.channel_layer.group_add(
            self.notification_group_name, self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.notification_group_name, self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def send_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification",
                    "id": event["id"],
                    "user": event["user"],
                    "message": event["message"],
                    "created_at": event["created_at"],
                }
            )
        )
