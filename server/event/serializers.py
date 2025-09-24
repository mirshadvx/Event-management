from rest_framework import serializers
from .models import *
from users.models import Profile
import json
import cloudinary.uploader


class EventSerializer(serializers.ModelSerializer):
    tickets = serializers.CharField()
    event_banner = serializers.FileField(required=False, allow_null=True)
    promotional_image = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "organizer",
            "event_title",
            "event_type",
            "description",
            "venue_name",
            "address",
            "city",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "visibility",
            "capacity",
            "age_restriction",
            "special_instructions",
            "event_banner",
            "promotional_image",
            "is_draft",
            "is_published",
            "tickets",
            "created_at",
            "updated_at",
            "cancel_ticket",
        ]
        read_only_fields = ["organizer", "created_at", "updated_at"]

    def create(self, validated_data):
        return self.save_event(validated_data)

    def update(self, instance, validated_data):
        return self.save_event(validated_data, instance)

    def save_event(self, validated_data, instance=None):
        try:
            tickets_data = json.loads(validated_data.pop("tickets"))
            request = self.context.get("request")

            if "event_banner" in validated_data and validated_data["event_banner"]:
                upload_result = cloudinary.uploader.upload(
                    validated_data.pop("event_banner")
                )
                validated_data["event_banner"] = upload_result["url"]

            if (
                "promotional_image" in validated_data
                and validated_data["promotional_image"]
            ):
                upload_result = cloudinary.uploader.upload(
                    validated_data.pop("promotional_image")
                )
                validated_data["promotional_image"] = upload_result["url"]

            validated_data["age_restriction"] = bool(
                validated_data.get("age_restriction", False)
            )
            validated_data["is_draft"] = bool(validated_data.get("is_draft", False))
            validated_data["is_published"] = bool(
                validated_data.get("is_published", False)
            )

            if instance:
                for key, value in validated_data.items():
                    setattr(instance, key, value)
                instance.save()
                Ticket.objects.filter(event=instance).delete()
            else:
                validated_data["organizer"] = request.user
                instance = Event.objects.create(**validated_data)

            for ticket_data in tickets_data:
                Ticket.objects.create(
                    event=instance,
                    ticket_type=ticket_data["ticketType"],
                    price=ticket_data["ticketPrice"],
                    quantity=ticket_data["ticketQuantity"],
                    description=ticket_data.get("ticketDescription", ""),
                )

            return instance
        except Exception as e:
            raise


class EventPreviewSerializer(serializers.ModelSerializer):
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    class Meta:
        model = Event
        fields = ["id", "event_title", "event_banner", "like_count", "comment_count"]


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    profile_picture = serializers.CharField(
        source="user.profile_picture", read_only=True
    )

    class Meta:
        model = Comment
        fields = ["id", "username", "profile_picture", "text", "created_at"]


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_type",
            "price",
            "quantity",
            "description",
            "sold_quantity",
        ]


class EventSerializerExplore(serializers.ModelSerializer):
    organizer_username = serializers.CharField(
        source="organizer.username", read_only=True
    )
    organizer_profile_picture = serializers.CharField(
        source="organizer.profile_picture", read_only=True
    )
    comments = CommentSerializer(many=True, read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    total_tickets_sold = serializers.SerializerMethodField()
    liked = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "event_title",
            "event_type",
            "description",
            "venue_name",
            "address",
            "city",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "visibility",
            "capacity",
            "age_restriction",
            "special_instructions",
            "event_banner",
            "promotional_image",
            "organizer_username",
            "organizer_profile_picture",
            "comments",
            "tickets",
            "like_count",
            "comment_count",
            "total_tickets_sold",
            "is_published",
            "created_at",
            "liked",
        ]

    def get_like_count(self, obj):
        return obj.like_count()

    def get_comment_count(self, obj):
        return obj.comment_count()

    def get_total_tickets_sold(self, obj):
        return obj.total_tickets_sold()

    def get_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            user_pro = request.user
            return obj.likes.filter(user=user_pro).exists()
        return False


class LiveStreamSerializer(serializers.ModelSerializer):
    event_name = serializers.CharField(source="event.name", read_only=True)
    organizer_name = serializers.CharField(
        source="organizer.user.username", read_only=True
    )

    class Meta:
        model = LiveStream
        fields = [
            "id",
            "event",
            "event_name",
            "room_id",
            "stream_status",
            "organizer_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TicketsEventsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = "__all__"


class EventCompleteDataSerializer(serializers.ModelSerializer):
    tickets = TicketsEventsSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = "__all__"


class BookedEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "event_title",
            "event_type",
            "venue_name",
            "address",
            "city",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "event_banner",
        ]


class BookedTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["ticket_type", "price", "description"]


class TicketPurchaseSerializer(serializers.ModelSerializer):
    ticket = BookedTicketSerializer()

    class Meta:
        model = TicketPurchase
        fields = [
            "unique_id",
            "booking_id",
            "ticket",
            "quantity",
            "used_tickets",
            "total_price",
            "purchased_at",
            "unique_qr_code",
        ]


class BookingSerializer(serializers.ModelSerializer):
    event = BookedEventSerializer()
    ticket_purchases = TicketPurchaseSerializer(many=True)

    class Meta:
        model = Booking
        fields = [
            "booking_id",
            "event",
            "payment_method",
            "subtotal",
            "discount",
            "total",
            "track_discount",
            "created_at",
            "ticket_purchases",
        ]
