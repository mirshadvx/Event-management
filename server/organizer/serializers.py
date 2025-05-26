from rest_framework import serializers
from event.models import Event
from users.models import Profile, Booking, TicketRefund
from event.models import Event
from .models import *
from event.models import Event
from users.models import Booking

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
        return Event.objects.filter(organizer=obj, revenue_distributed=True).count()
    
    def get_participated_events_count(self, obj):
        return Booking.objects.filter(user=obj, ticket_purchases__isnull=False).distinct().count()
        
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
        
class ParticipatedEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id","event_banner", "event_type", "venue_name",
                  "start_date", "end_date", "start_time", "end_time",
                  ]
        


class TicketDetailSerializer(serializers.Serializer):
    date = serializers.DateField()
    purchases = serializers.IntegerField()
    cancellations = serializers.IntegerField()

class TicketTypeSerializer(serializers.Serializer):
    details = TicketDetailSerializer(many=True)
    totalPurchases = serializers.IntegerField()
    totalCancellations = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)

class TicketStatsSerializer(serializers.Serializer):
    regular = TicketTypeSerializer()
    vip = TicketTypeSerializer()
    gold = TicketTypeSerializer()

class SummarySerializer(serializers.Serializer):
    totalRevenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    totalParticipants = serializers.IntegerField()
    totalLimit = serializers.IntegerField()
    totalPurchases = serializers.IntegerField()
    totalCancellations = serializers.IntegerField()

class EventStatsSerializer(serializers.Serializer):
    eventId = serializers.CharField()
    ticketStats = TicketStatsSerializer()
    summary = SummarySerializer()
