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
        
class GroupConversationSerializer(serializers.ModelSerializer):
    # participants = UserListSerializer(many=True, read_only=True)
    admin = UserListSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    profile_picture = serializers.CharField(source="event.event_banner")
    
    class Meta:
        model = GroupConversation
        fields = ["id", "name", "admin", "created_at", "updated_at", "last_message", "unread_count", "profile_picture"]
        
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            return {
                'content': last_message.content,
                'timestamp': last_message.timestamp,
                'sender_username': last_message.sender.username,
                'read_count': last_message.read_by.count()
            }
        return None
    
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.exclude(read_by=user).exclude(sender=user).count()
        
class GroupMessageSerializer(serializers.ModelSerializer):
    sender = UserListSerializer()
    read_by_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupMessage
        fields = ["id", "conversation", "sender", "content", "timestamp", "read_by_count"]
        
    def get_read_by_count(self, obj):
        return obj.read_by.count()
    
class CreateGroupMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMessage
        fields = ["content"]
        
    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty!")
        return value