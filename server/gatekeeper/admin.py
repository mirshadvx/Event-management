from django.contrib import admin
from .models import ManagedUser

@admin.register(ManagedUser)
class ManagedUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'event', 'active', 'permission_given_date', 'created_at')
    list_filter = ('active', 'event')
    search_fields = ('username', 'event__event_title')
    readonly_fields = ('created_at', 'updated_at')