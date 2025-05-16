from django.contrib import admin
from .models import *

admin.site.register(Event)
admin.site.register(Ticket)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(TicketPurchase)
admin.site.register(LiveStream)
