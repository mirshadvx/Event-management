from django.contrib import admin
from .models import Profile, SocialMediaLink, UserSettings, Wallet, WalletTransaction, Booking

admin.site.register(Profile)
admin.site.register(SocialMediaLink)
admin.site.register(UserSettings)
admin.site.register(WalletTransaction)
admin.site.register(Wallet)
admin.site.register(Booking)