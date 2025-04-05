from django.contrib import admin
from .models import Event, Ticket, Comment, Like, TicketPurchase

admin.site.register(Event)
admin.site.register(Ticket)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(TicketPurchase)
