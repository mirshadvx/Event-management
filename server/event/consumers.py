import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import LiveStream, Event
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


class WebRTCConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user = self.scope["user"]
            if not self.user.is_authenticated:
                logger.warning("[WebRTCConsumer] Unauthenticated connection attempt")
                await self.close(code=4001)
                return

            self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
            self.room_group_name = f"webrtc_room_{self.room_id}"
            self.user_id = str(self.user.id)
            self.user_name = self.user.username

            logger.info(f"[WebRTCConsumer] User {self.user_id} ({self.user_name}) connecting to room {self.room_id}")

            has_access = await self.verify_room_access()
            if not has_access:
                logger.warning(f"[WebRTCConsumer] User {self.user_id} denied access to room {self.room_id}")
                await self.close(code=4003)
                return

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
            logger.info(f"[WebRTCConsumer] User {self.user_id} connected to room {self.room_id}")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user_joined",
                    "user_id": self.user_id,
                    "user_name": self.user_name,
                },
            )
            logger.info(f"[WebRTCConsumer] User {self.user_id} joined notification sent")
        except Exception as e:
            logger.error(f"[WebRTCConsumer] Error in connect: {str(e)}", exc_info=True)
            await self.close(code=1011)

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user_left",
                    "user_id": self.user_id,
                    "user_name": self.user_name,
                },
            )
            logger.info(f"[WebRTCConsumer] User {self.user_id} left notification sent")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "offer":
                target_user_id = data.get("target_user_id")
                if not target_user_id:
                    logger.warning(f"[WebRTCConsumer] Offer from {self.user_id} missing target_user_id")
                    return
                logger.info(f"[WebRTCConsumer] Forwarding offer from {self.user_id} to {target_user_id}")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "webrtc_offer",
                        "offer": data.get("offer"),
                        "sender_id": self.user_id,
                        "sender_name": self.user_name,
                        "target_user_id": target_user_id,
                    },
                )

            elif message_type == "answer":
                target_user_id = data.get("target_user_id")
                logger.info(f"[WebRTCConsumer] Forwarding answer from {self.user_id} to {target_user_id}")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "webrtc_answer",
                        "answer": data.get("answer"),
                        "sender_id": self.user_id,
                        "sender_name": self.user_name,
                        "target_user_id": target_user_id,
                    },
                )

            elif message_type == "ice_candidate":
                target_user_id = data.get("target_user_id")
                logger.debug(f"[WebRTCConsumer] Forwarding ICE candidate from {self.user_id} to {target_user_id}")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "webrtc_ice_candidate",
                        "candidate": data.get("candidate"),
                        "sender_id": self.user_id,
                        "sender_name": self.user_name,
                        "target_user_id": target_user_id,
                    },
                )

            elif message_type == "get_users":
                logger.info(f"[WebRTCConsumer] User {self.user_id} requested user list")
                await self.send_user_list()

            elif message_type == "stream_ended":
                is_host = await self.is_host()
                logger.info(f"[WebRTCConsumer] Stream ended message from user {self.user_id}, is_host: {is_host}")
                if is_host:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "stream_ended_notification",
                            "message": "Stream ended by host",
                        },
                    )
                    logger.info(f"[WebRTCConsumer] Stream ended notification sent to room {self.room_id}")

        except json.JSONDecodeError as e:
            logger.error(f"[WebRTCConsumer] JSON decode error: {str(e)}")
            await self.send(text_data=json.dumps({"error": "Invalid JSON"}))
        except Exception as e:
            logger.error(f"[WebRTCConsumer] Error in receive: {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({"error": str(e)}))

    async def user_joined(self, event):
        if event["user_id"] != self.user_id:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "user_joined",
                        "user_id": event["user_id"],
                        "user_name": event["user_name"],
                    }
                )
            )

    async def user_left(self, event):
        if event["user_id"] != self.user_id:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "user_left",
                        "user_id": event["user_id"],
                        "user_name": event["user_name"],
                    }
                )
            )

    async def webrtc_offer(self, event):
        target_user_id = event.get("target_user_id")
        if target_user_id and target_user_id == self.user_id and event["sender_id"] != self.user_id:
            logger.info(f"[WebRTCConsumer] Sending offer from {event['sender_id']} to {self.user_id}")
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "offer",
                        "offer": event["offer"],
                        "sender_id": event["sender_id"],
                        "sender_name": event["sender_name"],
                    }
                )
            )
        elif target_user_id and target_user_id != self.user_id:
            logger.debug(f"[WebRTCConsumer] Offer not for {self.user_id}, ignoring (target: {target_user_id})")

    async def webrtc_answer(self, event):
        if event["target_user_id"] == self.user_id:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "answer",
                        "answer": event["answer"],
                        "sender_id": event["sender_id"],
                        "sender_name": event["sender_name"],
                    }
                )
            )

    async def webrtc_ice_candidate(self, event):
        if event["target_user_id"] == self.user_id:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "ice_candidate",
                        "candidate": event["candidate"],
                        "sender_id": event["sender_id"],
                        "sender_name": event["sender_name"],
                    }
                )
            )

    async def stream_ended_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "stream_ended",
                    "message": event["message"],
                }
            )
        )

    async def send_user_list(self):
        channel_layer = self.channel_layer
        group_channels = await channel_layer.group_channels(self.room_group_name)
        await self.send(
            text_data=json.dumps(
                {
                    "type": "user_list",
                    "users": [{"user_id": self.user_id, "user_name": self.user_name}],
                }
            )
        )

    @database_sync_to_async
    def verify_room_access(self):
        try:
            logger.info(f"[WebRTCConsumer] Verifying access for user {self.user.id} to room {self.room_id}")
            live_stream = LiveStream.objects.get(
                room_id=self.room_id, stream_status="live"
            )
            event = live_stream.event
            logger.info(f"[WebRTCConsumer] Found live stream for event {event.id}, organizer: {live_stream.organizer.id}")

            if live_stream.organizer.id == self.user.id:
                logger.info(f"[WebRTCConsumer] User {self.user.id} is the organizer - access granted")
                return True

            from users.models import Booking

            has_booking = Booking.objects.filter(
                user=self.user, event=event
            ).exists()

            logger.info(f"[WebRTCConsumer] User {self.user.id} booking status: {has_booking}")
            return has_booking
        except LiveStream.DoesNotExist:
            logger.warning(f"[WebRTCConsumer] No live stream found for room {self.room_id}")
            return False
        except Exception as e:
            logger.error(f"[WebRTCConsumer] Error verifying room access: {str(e)}", exc_info=True)
            return False

    @database_sync_to_async
    def is_host(self):
        try:
            live_stream = LiveStream.objects.get(
                room_id=self.room_id, stream_status="live"
            )
            return live_stream.organizer.id == self.user.id
        except LiveStream.DoesNotExist:
            return False

