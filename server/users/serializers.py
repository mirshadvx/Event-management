from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, SocialMediaLink, UserSettings
from decouple import config
import redis
from .models import Wallet, Profile, Booking, WalletTransaction
from Admin.models import Coupon, SubscriptionPlan, UserSubscription
from event.models import Ticket, TicketPurchase, Event, Comment

redis_client = redis.Redis(
    host=config("REDIS_HOST", "localhost"),
    port=config("REDIS_PORT", 6379, cast=int),
    db=config("REDIS_DB", 0, cast=int)
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Profile
        fields = ["username", "email", "password"]
    
    def validate(self, data):
        # if redis_client.exists(f"temp_user:{data["email"]}") or Profile.objects.filter(email=data["email"]).exists():
        #     raise serializers.ValidationError({"email":"Email is already in use"})
        return data
        
class OTPVarificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    
   

class SocialMediaLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaLink
        fields = ["platform", "url"]

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ["notification", "marketing_emails", "two_factor_auth", "theme"]


class UserProfileSerializer(serializers.ModelSerializer):
    social_media_links = SocialMediaLinkSerializer(many=True)
    settings = UserSettingsSerializer()
    plan = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "username",
            "title",
            "email",
            "organizerVerified",
            "phone",
            "location",
            "bio",
            "profile_picture",
            "created_at",
            "social_media_links",
            "settings",
            "plan",
        ]
        read_only_fields = ["email", "created_at"]

    def update(self, instance, validated_data): 
        request = self.context.get("request")
        if "organizerVerified" in validated_data and not request.user.is_staff:
            validated_data.pop("organizerVerified")
           

        social_media_links_data = validated_data.pop("social_media_links", None)
        settings_data = validated_data.pop("settings", None)

      
        instance = super().update(instance, validated_data)

       
        if social_media_links_data is not None:
            for link_data in social_media_links_data:
                SocialMediaLink.objects.update_or_create(
                    user=instance,
                    platform=link_data.get("platform"),
                    defaults=link_data
                )

       
        if settings_data is not None:
            UserSettings.objects.update_or_create(
                user=instance,
                defaults=settings_data
            )

        return instance

    def get_plan(self, obj):
        subscription = obj.user_subscription.first()
        if subscription:
            return subscription.plan.name
        return None
            

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["balance"]
        
class TicketPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketPurchase
        fields = "__all__"

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ["code", "title", "discount_type", "discount_value"]

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
        
class ProfileTicketPurchaseSerializer(serializers.ModelSerializer):
    ticket_type = serializers.CharField(source="ticket.ticket_type", read_only=True)

    class Meta:
        model = TicketPurchase
        fields = ["id", "quantity", "ticket_type", "total_price"]
        


class ProfileBooking_idSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["booking_id"]

class ProfileEventSerializer(serializers.ModelSerializer):
    organizer_username = serializers.CharField(source="organizer.username", read_only=True)
    organizer_profile_picture = serializers.CharField(source="organizer.profile_picture", read_only=True)
    like_count = serializers.SerializerMethodField()
    liked = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "event_title", "event_type", "description",
            "venue_name", "address", "city",
            "start_date", "end_date", "start_time", "end_time",
            "visibility", "capacity", "age_restriction",
            "special_instructions", "event_banner",
            "organizer_username", "organizer_profile_picture",
            "like_count", "liked"
        ]

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

class ProfileEventJoinedSerializer(serializers.ModelSerializer):
    event = ProfileEventSerializer(read_only=True)
    tickets = ProfileTicketPurchaseSerializer(source="ticket_purchases", many=True, read_only=True)
    booking_id = serializers.UUIDField()

    class Meta:
        model = Booking
        fields = [
            "booking_id", "event", "payment_method", "subtotal", 
            "discount", "total", "created_at", "tickets"
        ]
    
class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = "__all__"
        
class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)
    class Meta:
        model = Wallet
        fields = ["user", "balance", "updated_at","transactions"]
        
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ["id", "name" , "price", "features"]