from django.contrib import admin
from .models import ManagedUser, TicketScanLog

@admin.register(ManagedUser)
class ManagedUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'event', 'active', 'permission_given_date', 'created_at')
    list_filter = ('active', 'event')
    search_fields = ('username', 'event__event_title')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TicketScanLog)
class TicketScanLogAdmin(admin.ModelAdmin):
    list_display = ("event", "guard", "status", "holder", "tier", "scanned_at")
    list_filter = ("event", "status", "scanned_at")
    search_fields = ("scanned_code", "holder", "booking_id", "guard__username")
    readonly_fields = ("scanned_at",)
