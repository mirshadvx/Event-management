import django_filters
from .models import Event
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count, Q


class EventFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="event_type", lookup_expr="iexact")
    location = django_filters.CharFilter(method="filter_by_location")
    time = django_filters.CharFilter(method="filter_by_time")
    popularity = django_filters.CharFilter(method="filter_by_popularity")
    search = django_filters.CharFilter(method="filter_by_search")

    class Meta:
        model = Event
        fields = ["category", "location", "time", "popularity", "search"]

    def filter_by_location(self, queryset, name, value):
        return queryset.filter(
            Q(city__icontains=value)
            | Q(address__icontains=value)
            | Q(venue_name__icontains=value)
        )

    def filter_by_time(self, queryset, name, value):
        from django.utils import timezone

        now = timezone.now().date()

        if value == "Today":
            return queryset.filter(start_date=now)
        elif value == "This Week":
            week_start = now - timedelta(days=now.weekday())
            week_end = week_start + timedelta(days=6)
            return queryset.filter(start_date__range=[week_start, week_end])
        elif value == "This Month":
            return queryset.filter(
                start_date__month=now.month, start_date__year=now.year
            )
        elif value == "Upcoming":
            return queryset.filter(start_date__gte=now)
        return queryset

    def filter_by_popularity(self, queryset, name, value):
        if value == "Most Liked":
            return queryset.order_by("-like_count")
        elif value == "Most Attended":
            return queryset.annotate(
                attendee_count=Count("tickets__sold_quantity")
            ).order_by("-attendee_count")
        elif value == "Trending":
            return queryset.order_by("-comment_count", "-like_count")
        return queryset

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(event_title__icontains=value)
            | Q(description__icontains=value)
            | Q(venue_name__icontains=value)
            | Q(organizer__username__icontains=value)
        )
