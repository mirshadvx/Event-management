from rest_framework import serializers
from users.models import Profile, Booking
from event.models import Event, Review
from Admin.models import UserBadge
from .models import Follow


class UserProfileSerializer(serializers.ModelSerializer):
    organized_events_count = serializers.SerializerMethodField()
    participated_events_count = serializers.SerializerMethodField()
    event_success_rate = serializers.SerializerMethodField()
    achieved_badges = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "organized_events_count",
            "participated_events_count",
            "event_success_rate",
            "achieved_badges",
        ]

    def get_organized_events_count(self, obj):
        return Event.objects.filter(organizer=obj, revenue_distributed=True).count()

    def get_participated_events_count(self, obj):
        return (
            Booking.objects.filter(user=obj, ticket_purchases__isnull=False)
            .distinct()
            .count()
        )

    def get_event_success_rate(self, obj):
        events = obj.events.all()
        total_success_rate = 0
        for event in events:
            total_tickets_sold = sum(
                ticket.sold_quantity for ticket in event.tickets.all()
            )
            success_rate = (
                (total_tickets_sold / event.capacity) * 100 if event.capacity else 0
            )
            total_success_rate += success_rate
        return round(total_success_rate / len(events) if events else 0)

    def get_achieved_badges(self, obj):
        user_badges = UserBadge.objects.filter(user=obj, date_earned__isnull=False)
        return [
            {
                "badge_name": badge.badge.name,
                "description": badge.badge.description,
                "icon": badge.badge.icon,
                "date": badge.date_earned,
            }
            for badge in user_badges
        ]


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ["follower", "followed", "created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "event", "user", "rating", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate(self, data):
        if data.get("comment") and not data["comment"].strip():
            raise serializers.ValidationError(
                {"comment": "Comment cannot be empty if provided"}
            )
        return data


class FollowRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="follower.username")

    class Meta:
        model = Follow
        fields = ["id", "username", "created_at"]
