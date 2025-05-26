from rest_framework import serializers
from users.models import Profile, Booking
from event.models import Event, TicketPurchase
from Admin.models import UserBadge

class UserProfileSerializer(serializers.ModelSerializer):
    organized_events_count = serializers.SerializerMethodField()
    participated_events_count = serializers.SerializerMethodField()
    event_success_rate = serializers.SerializerMethodField()
    achieved_badges = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['organized_events_count','participated_events_count',
                  'event_success_rate', 'achieved_badges']

    def get_organized_events_count(self, obj):
        return Event.objects.filter(organizer=obj, revenue_distributed=True).count()

    def get_participated_events_count(self, obj):
        return Booking.objects.filter(user=obj, ticket_purchases__isnull=False).distinct().count()

    def get_event_success_rate(self, obj):
        events = obj.events.all()
        total_success_rate = 0
        for event in events:
            total_tickets_sold = sum(ticket.sold_quantity for ticket in event.tickets.all())
            success_rate = (total_tickets_sold / event.capacity) * 100 if event.capacity else 0
            total_success_rate += success_rate
        return round(total_success_rate / len(events) if events else 0)
    
    def get_achieved_badges(self, obj):
        user_badges = UserBadge.objects.filter(user=obj, date_earned__isnull=False)
        return [{"badge_name": badge.badge.name, "description": badge.badge.description, "icon": badge.badge.icon, "date": badge.date_earned} for badge in user_badges]