# backend/serializers.py
from rest_framework import serializers
from .models import OrganizerRequest, Coupon, Badge, UserBadge
from users.models import Profile, SocialMediaLink
import cloudinary.uploader

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
        
        

# class BadgeSerializer(serializers.ModelSerializer):
#     icon = serializers.ImageField(required=False)  # Changed to ImageField for file upload

#     class Meta:
#         model = Badge
#         fields = ['id', 'name', 'description', 'category', 'icon', 'target_count', 
#                  'applicable_role', 'criteria_type']

#     def create(self, validated_data):
#         icon_file = validated_data.pop('icon', None)
#         if icon_file:
#             upload_result = cloudinary.uploader.upload(icon_file)
#             validated_data['icon'] = upload_result['secure_url']
#         return Badge.objects.create(**validated_data)
    
#     def update(self, instance, validated_data):
#         icon_file = validated_data.pop('icon', None)
#         if icon_file:
#             upload_result = cloudinary.uploader.upload(icon_file)
#             print("******",upload_result)
#             instance.icon = upload_result['secure_url']
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         return instance

class BadgeSerializer(serializers.ModelSerializer):
    icon = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'category', 'icon', 'target_count', 
                 'applicable_role', 'criteria_type']

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