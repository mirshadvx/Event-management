from rest_framework import serializers
from event.models import Event

class EventOrganizerList(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id","event_banner", "event_type", "venue_name",
                  "start_date", "end_date", "start_time", "end_time",
                  "is_draft", "is_published", "revenue_distributed"
                  ]