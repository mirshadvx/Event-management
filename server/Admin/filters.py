import django_filters
from .models import RevenueDistribution
from event.models import Event
from django.db.models import Q
from datetime import datetime, timedelta

class RevenueDistributionFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    date_range = django_filters.CharFilter(method='filter_date_range')
    start_date = django_filters.DateFilter(method='filter_custom_date')
    end_date = django_filters.DateFilter(method='filter_custom_date')
    event_type = django_filters.ChoiceFilter(
        field_name='event__event_type',
        choices=Event.EVENT_TYPE_CHOICES
    )
    
    class Meta:
        model = RevenueDistribution
        fields = ['search','date_range','start_date','end_date','event_type']
        
    def filter_search(self, queryset, name , value):
        return queryset.filter(
            Q(event__event_title__icontains=value) | Q(event__organizer__username__icontains=value)
        )
        
    def filter_date_range(self, queryset, name, value):
        now = datetime.now()
        
        if value == 'today':
            return queryset.filter(distributed_at__date=now.date())
        elif value == 'week':
            week_start = now - timedelta(days=now.weekday())
            return queryset.filter(distributed_at__date__gte=week_start.date())
        elif value == 'month':
            return queryset.filter(distributed_at__year=now.year, 
                                distributed_at__month=now.month)
        elif value == 'year':
            return queryset.filter(distributed_at__year=now.year)
        elif value == 'all':
            return queryset
        return queryset

    def filter_custom_date(self, queryset, name, value):
        if name == 'start_date':
            return queryset.filter(distributed_at__date__gte=value)
        elif name == 'end_date':
            return queryset.filter(distributed_at__date__lte=value)
        return queryset
    
    