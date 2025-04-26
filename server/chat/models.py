from django.db import models
from users.models import Profile
from django.db.models import Prefetch

class ConversationManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().prefetch_related(
            Prefetch('participants', queryset=Profile.objects.only('id','username'))
        )
        

class Conversation(models.Model):
    participants = models.ManyToManyField(Profile, related_name='conservations')
    created_at = models.DateTimeField(auto_now_add=True)
    objects = ConversationManager()
    
    def __str__(self):
        participants_name = " ,".join([user.username for user in self.participants.all()])
        return f'Chat in {participants_name}'

class Message(models.Model):
    conservation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='message')
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    # meida
    
    def __str__(self):
        return f'Message from {self.sender.username}'