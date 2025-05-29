from rest_framework import generics, permissions, status , views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import Profile
from django.shortcuts import get_object_or_404
from .models import *
from .serializers import *
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.pagination import PageNumberPagination
import jwt
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken

class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response({"error": "Participant ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            participant = Profile.objects.get(id=participant_id)
            if participant == request.user:
                return Response({"success": False,"error": "Cannot start conversation with yourself"}, status=status.HTTP_400_BAD_REQUEST)
        except Profile.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        existing_conversation = Conversation.objects.filter(participants=request.user).filter(participants=participant)
        
        if existing_conversation.exists():
            serializer = self.get_serializer(existing_conversation.first())
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, participant)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateMessageSerializer
        return MessageSerializer

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(Conversation, id=conversation_id)
        if self.request.user not in conversation.participants.all():
            raise PermissionDenied("You are not a participant in this conversation")
        return Message.objects.filter(conversation=conversation).order_by('timestamp')
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(Conversation, id=conversation_id)
        if self.request.user not in conversation.participants.all():
            raise PermissionDenied("You are not a participant in this conversation")
        serializer.save(sender=self.request.user, conversation=conversation)

class MessageRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(conversation_id=conversation_id)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.sender != request.user:
            return Response({"error": "You can only delete your own messages"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class PassSocketToken(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            token = AccessToken.for_user(user)
            return Response({"token": str(token)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Unable to generate token"}, status=status.HTTP_400_BAD_REQUEST)
        
        
class GroupConversationListView(generics.ListAPIView):
    serializer_class = GroupConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return GroupConversation.objects.filter(participants=user).order_by('-updated_at')

class GroupConversationDetailView(generics.RetrieveAPIView):
    serializer_class = GroupConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return GroupConversation.objects.filter(participants=user)

class GroupMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateGroupMessageSerializer
        return GroupMessageSerializer

    def get_queryset(self):
        group_id = self.kwargs.get('group_id')
        group = get_object_or_404(GroupConversation, id=group_id)
        if self.request.user not in group.participants.all():
            raise PermissionDenied("You are not a participant in this group conversation")
        return GroupMessage.objects.filter(conversation=group).order_by('timestamp')
    
    def perform_create(self, serializer):
        group_id = self.kwargs.get('group_id')
        group = get_object_or_404(GroupConversation, id=group_id)
        if self.request.user not in group.participants.all():
            raise PermissionDenied("You are not a participant in this group conversation")
        message = serializer.save(sender=self.request.user, conversation=group)
        # Add sender to read_by automatically
        message.read_by.add(self.request.user)

class GroupMessageRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    serializer_class = GroupMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        group_id = self.kwargs.get('group_id')
        return GroupMessage.objects.filter(conversation_id=group_id)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.sender != request.user and instance.conversation.admin != request.user:
            return Response({"error": "Only the sender or group admin can delete this message"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class MarkGroupMessageAsReadView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        message_id = kwargs.get('message_id')
        message = get_object_or_404(GroupMessage, id=message_id)
        
        if request.user not in message.conversation.participants.all():
            return Response({"error": "You are not a participant in this group"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        message.read_by.add(request.user)
        return Response({"success": True}, status=status.HTTP_200_OK)

class NotificationList(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def delete(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response({'message': 'all notifications deleted'}, status=status.HTTP_200_OK)

class NotificationDetail(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.delete()
            return Response({'message': 'notification deleted'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        
class ChatInfo(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, chat_id, chat_type):
        if chat_type == 'personal':
            try:
                conversation = Conversation.objects.get(id=chat_id)
                serializer = PersonalChatSerializer(conversation)
                return Response(serializer.data)
            except Conversation.DoesNotExist:
                return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        elif chat_type == 'group':
            try:
                group_conversation = GroupConversation.objects.get(id=chat_id)
                serializer = GroupChatSerializer(group_conversation)
                return Response(serializer.data)
            except GroupConversation.DoesNotExist:
                return Response({"error": "Group conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Invalid chat type"}, status=status.HTTP_400_BAD_REQUEST)