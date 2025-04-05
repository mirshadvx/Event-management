from django.contrib import admin
from .models import OrganizerRequest, Coupon, Badge, UserBadge, SubscriptionPlan, UserSubscription

admin.site.register(OrganizerRequest)
admin.site.register(Coupon)
admin.site.register(Badge)
admin.site.register(UserBadge)
admin.site.register(SubscriptionPlan)
admin.site.register(UserSubscription)