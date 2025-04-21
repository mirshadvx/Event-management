# backend/serializers.py
from rest_framework import serializers
from .models import (OrganizerRequest, Coupon, Badge, UserBadge, RevenueDistribution,
                     SubscriptionPlan, UserSubscription)
from users.models import Profile, SocialMediaLink, Booking, WalletTransaction, TicketRefund
import cloudinary.uploader
from event.models import TicketPurchase, Event

class SocialMediaLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaLink
        fields = ['platform', 'url']

class ProfileSerializer(serializers.ModelSerializer):
    social_media_links = SocialMediaLinkSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'email', 'bio', 'profile_picture', 
            'title', 'phone', 'location', 'organizerVerified', 
            'created_at', 'social_media_links'
        ]

class OrganizerRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email')
    profile_picture = serializers.CharField(source='user.profile_picture')
    
    class Meta:
        model = OrganizerRequest
        fields = ['id', 'username','profile_picture', 'email', 'status', 'requested_at', 'admin_notes']
        
        
class ProfileSerializerAdmin(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'email', 'is_active', 'is_staff',
            'profile_picture', 'date_joined', 'created_at'
        ]
        
class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"
        
class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'category', 'icon', 'target_count', 
                 'applicable_role', 'criteria_type', 'is_active']

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer()
    user = serializers.StringRelatedField()
    
    class Meta:
        model = UserBadge
        fields = ['id', 'user', 'badge', 'date_earned']

class BadgeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['username', 'email']
        

class RevenueDistributionSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.event_title')
    event_type = serializers.CharField(source='event.event_type')
    organizer = serializers.CharField(source='event.organizer.username')
    
    class Meta:
        model = RevenueDistribution
        fields = [
            'id',
            'event_title',
            'event_type',
            'organizer',
            'admin_percentage',
            'total_revenue',
            'total_participants',
            'admin_amount',
            'organizer_amount',
            'distributed_at',
            'is_distributed'
        ]
        
class RevenueSummarySerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    today_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    monthly_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)

class TicketPurchaseSrializer(serializers.ModelSerializer):
    ticket_type = serializers.CharField(source='ticket.ticket_type')
    
    class Meta:
        model = TicketPurchase
        fields = ['ticket_type', 'quantity', 'total_price']
    
class BookingSerializerHistory(serializers.ModelSerializer):
    ticket_purchases = TicketPurchaseSrializer(many=True)
    username = serializers.CharField(source='user.username')
    event_title = serializers.CharField(source='event.event_title')
    
    class Meta:
        model = Booking
        fields = ['booking_id','username', 'event_title', 'payment_method', 'subtotal', 'discount', 'total',
                  'created_at', 'ticket_purchases']
        

class TicketRefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketRefund
        fields = ['ticket_type', 'quantity', 'amount']


class RefundHistorySerializer(serializers.ModelSerializer):
    event_title = serializers.SerializerMethodField()
    ticket_details = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = WalletTransaction
        fields = ['id', 'transaction_id', 'transaction_type', 'amount', 'created_at', 
                 'event_title', 'ticket_details', 'user']

    def get_event_title(self, obj):
        refund_details = obj.refund_details.first()
        if refund_details and refund_details.event:
            return refund_details.event.event_title
        elif obj.booking and obj.booking.event:
            return obj.booking.event.event_title
        return None

    def get_ticket_details(self, obj):
        refund_details = obj.refund_details.all()
        if refund_details.exists():
            return TicketRefundSerializer(refund_details, many=True).data
        return []

    def get_user(self, obj):
        if obj.wallet and obj.wallet.user:
            return {
                'id': obj.wallet.user.id,
                'username': obj.wallet.user.username
            }
        return None
    
        
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
        
class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['name', 'price', 'active',]

class UserSubscriptionSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    plan = PlanSerializer()
    paid_amount = serializers.SerializerMethodField()
    transaction_type = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'plan', 'start_date', 'end_date', 'is_active',
            'payment_method', 'paid_amount', 'transaction_type',
            'days_remaining'
        ]

    def get_user(self, obj):
        return {
            "username": obj.user.username,
            "email": obj.user.email
        }

    def get_paid_amount(self, obj):
        latest_transaction = obj.transactions.order_by('-transaction_date').first()
        return float(latest_transaction.amount) if latest_transaction else float(obj.plan.price)

    def get_transaction_type(self, obj):
        latest_transaction = obj.transactions.order_by('-transaction_date').first()
        return latest_transaction.transaction_type if latest_transaction else None

    def get_days_remaining(self, obj):
        return obj.days_remaining()
    
class OrganizerDetails(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["username", "email", "profile_picture"]
        
class EventSerializer(serializers.ModelSerializer):
    organizer = OrganizerDetails(read_only=True)
    total_tickets_sold = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id',
            'organizer',
            'event_title',
            'event_type',
            'description',
            'venue_name',
            'address',
            'city',
            'start_date',
            'end_date',
            'start_time',
            'end_time',
            'capacity',
            'total_tickets_sold'
        ]
    
    
    