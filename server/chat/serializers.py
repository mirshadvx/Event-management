from rest_framework import serializers
from .models import *

class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["id", "username", "profile_picture"]
        
class ConversationSerializer(serializers.ModelSerializer):
    participants = UserListSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ["id", "participants", "created_at", "last_message", "unread_count"]
        
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            return {
                'content': last_message.content,
                'timestamp': last_message.timestamp,
                'sender_username': last_message.sender.username,
                'is_read': last_message.read
            }
        return None
    
    def get_unread_count(self, obj):
        return obj.messages.filter(read=False).exclude(sender=self.context['request'].user).count()
        
class MessageSerializer(serializers.ModelSerializer):
    sender = UserListSerializer()

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "content", "timestamp", "read"]
    
class CreateMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["content"]
        
    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty!")
        return value
        
        