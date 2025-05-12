from rest_framework import serializers
from event.models import Event
from users.models import Profile, Booking
from event.models import Event
from .models import *

class EventOrganizerList(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id","event_banner", "event_type", "venue_name",
                  "start_date", "end_date", "start_time", "end_time",
                  "is_draft", "is_published", "revenue_distributed"
                  ]
        
class UserProfileSerializer(serializers.ModelSerializer):
    organized_events_count = serializers.SerializerMethodField()
    participated_events_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ["profile_picture", "title", "bio", "organizerVerified",
                  "organized_events_count", "participated_events_count",
                  "following_count", "followers_count", "following", "username"]
        
    def get_organized_events_count(self, obj):
        return Event.objects.filter(organizer=obj).count()
    
    def get_participated_events_count(self, obj):
        return Booking.objects.filter(user=obj).count()
        
    def get_following_count(self, obj):
        return obj.following.count()
    
    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_following(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return Follow.objects.filter(follower=request.user, followed=obj).exists()
        return False
        
class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ['follower', 'followed', 'created_at']