from django.db import models
from users.models import Profile
from django.db.models import Prefetch

class ConversationManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().prefetch_related(
            Prefetch('participants', queryset=Profile.objects.only('id', 'username'))
        )

class Conversation(models.Model):
    participants = models.ManyToManyField(Profile, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    objects = ConversationManager()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        participant_names = " ,".join([user.username for user in self.participants.all()])
        return f'Conversation with {participant_names}'


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', null=True)
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    
    def __str__(self):
        return f'Message from {self.sender.username}'
    
class GroupConversationManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().prefetch_related(
            Prefetch('participants', queryset=Profile.objects.only('id', 'username'))
        )

class GroupConversation(models.Model):
    name = models.CharField(max_length=120)
    participants = models.ManyToManyField(Profile, related_name='group_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, related_name='admin_groups')
    event = models.OneToOneField('event.Event', on_delete=models.CASCADE, related_name='group_chat', null=True)
    objects = GroupConversationManager()
    
    def __str__(self):
        return f"Group: {self.name}"
    
class GroupMessage(models.Model):
    conversation = models.ForeignKey(GroupConversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(Profile, related_name='read_group_messages', blank=True)

    def __str__(self):
        return f'Group Message from {self.sender.username} in {self.conversation.name}'