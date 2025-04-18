import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class OrganizerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["url_route"]["kwargs"]["user_id"]
        self.group_name = f"organizer_{self.user_id}"
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        
    async def receive(self, text_data):
        pass
    
    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "status_update",
            "status": event["status"],
            "admin_notes": event.get("admin_notes", ""),
            "organizerVerified": event["organizerVerified"],
        }))        