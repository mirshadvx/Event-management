from rest_framework import serializers
from .models import Event, Ticket, Like, Comment
from users.models import Profile
import json
import cloudinary.uploader

# class TicketSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Ticket
#         fields = ['ticket_type', 'price', 'quantity', 'description']

class EventSerializer(serializers.ModelSerializer):
    tickets = serializers.CharField()  # Handle tickets as a JSON string
    event_banner = serializers.FileField(required=False, allow_null=True)  # Handle file upload
    promotional_image = serializers.FileField(required=False, allow_null=True)  # Handle file upload

    class Meta:
        model = Event
        fields = [
            'id', 'organizer', 'event_title', 'event_type', 'description',
            'venue_name', 'address', 'city', 'start_date', 'end_date',
            'start_time', 'end_time', 'visibility', 'capacity',
            'age_restriction', 'special_instructions', 'event_banner',
            'promotional_image', 'is_draft', 'is_published', 'tickets',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['organizer', 'created_at', 'updated_at']

    def create(self, validated_data):
        try:
            # Extract tickets data and remove it from validated_data
            tickets_data = json.loads(validated_data.pop('tickets'))
            request = self.context.get('request')

            # Handle file uploads to Cloudinary
            if 'event_banner' in validated_data and validated_data['event_banner']:
                upload_result = cloudinary.uploader.upload(validated_data.pop('event_banner'))
                validated_data['event_banner'] = upload_result['url']

            if 'promotional_image' in validated_data and validated_data['promotional_image']:
                upload_result = cloudinary.uploader.upload(validated_data.pop('promotional_image'))
                validated_data['promotional_image'] = upload_result['url']

            # Convert string booleans to Python booleans
            # validated_data['age_restriction'] = validated_data.get('age_restriction', 'false').lower() == 'true'
            # validated_data['is_draft'] = validated_data.get('is_draft', 'false').lower() == 'true'
            # validated_data['is_published'] = validated_data.get('is_published', 'false').lower() == 'true'
            
            validated_data['age_restriction'] = bool(validated_data.get('age_restriction', False))
            validated_data['is_draft'] = bool(validated_data.get('is_draft', False))
            validated_data['is_published'] = bool(validated_data.get('is_published', False))

            # Set organizer from authenticated user
            validated_data['organizer'] = request.user

            # Create the event
            event = Event.objects.create(**validated_data)

            # Create tickets
            for ticket_data in tickets_data:
                Ticket.objects.create(
                    event=event,
                    ticket_type=ticket_data['ticketType'],
                    price=ticket_data['ticketPrice'],
                    quantity=ticket_data['ticketQuantity'],
                    description=ticket_data.get('ticketDescription', '')
                )

            return event
        except Exception as e:
            print(f"Error in serializer create method: {e}")
            raise

    def to_representation(self, instance):
        # Ensure the response includes the URLs as strings
        representation = super().to_representation(instance)
        representation['event_banner'] = instance.event_banner if instance.event_banner else None
        representation['promotional_image'] = instance.promotional_image if instance.promotional_image else None
        return representation

# class EventPreviewSerializer(serializers.ModelSerializer):
#     like_count = serializers.IntegerField()
#     comment_count = serializers.IntegerField()
#     class Meta:
#         model = Event
#         fields = ['id', 'event_title', 'event_banner', 'like_count', 'comment_count']

class EventPreviewSerializer(serializers.ModelSerializer):
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    def get_like_count(self, obj):
        return obj.likes.count()
    
    def get_comment_count(self, obj):
        return obj.comments.count()
    
    class Meta:
        model = Event
        fields = ['id', 'event_title', 'event_banner', 'like_count', 'comment_count']

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    profile_picture = serializers.CharField(source="user.profile_picture", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "username", "profile_picture", "text", "created_at"]
        
class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["id", "ticket_type", "price", "quantity", "description", "sold_quantity"]

class EventSerializerExplore(serializers.ModelSerializer):
    organizer_username = serializers.CharField(source="organizer.username", read_only=True)
    organizer_profile_picture = serializers.CharField(source="organizer.profile_picture", read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    total_tickets_sold = serializers.SerializerMethodField()
    liked = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "event_title", "event_type", "description", 
            "venue_name", "address", "city",
            "start_date", "end_date", "start_time", "end_time",
            "visibility", "capacity", "age_restriction", 
            "special_instructions", "event_banner", "promotional_image",
            "organizer_username", "organizer_profile_picture",
            "comments", "tickets", "like_count", "comment_count",
            "total_tickets_sold", "is_published", "created_at","liked",
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
        