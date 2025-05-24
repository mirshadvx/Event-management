import django_filters
from event.models import Event
from django.utils.timezone import  now
from datetime import timedelta
from django.db.models import Q

class OrganizerEventsFilter(django_filters.FilterSet):
    time_filter = django_filters.CharFilter(method='filter_by_time')
    category = django_filters.CharFilter(field_name='event_type', lookup_expr='iexact')
    start_date = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    organized = django_filters.BooleanFilter(method='filter_organized')
    ongoing = django_filters.BooleanFilter(method='filter_ongoing')
    drafted = django_filters.BooleanFilter(method='filter_drafted')
        
    class Meta:
        model = Event
        fields = ['time_filter','category','start_date', 'end_date', 'organized', 'ongoing', 'drafted']
        
    def filter_by_time(self, queryset, name, value):
        today = now().date()
        
        if value == 'All':
            return queryset
        elif value == 'today':
            return queryset.filter(start_date=today)
        elif value == 'Week':
            start_week = today - timedelta(days=today.weekday())
            end_week = start_week + timedelta(days=6)
            return queryset.filter(start_date__range=[start_week, end_week])
        elif value == 'Month':
            return queryset.filter(start_date__year=today.year, start_date__month=today.month)
        return queryset
    
    def filter_organized(self, queryset, name, value):
        if value:
            today = now().date()
            return queryset.filter(
                is_published=True,
                is_draft=False,
                end_date__lt=today
            )
        return queryset

    # def filter_ongoing(self, queryset, name, value):
    #     if value:
    #         curr_datetime = now()
    #         curr_date = curr_datetime.date()
    #         curr_time = curr_datetime.time()
    #         return queryset.filter(
    #             is_published=True,
    #             end_date__gte=curr_date,
    #             revenue_distributed=False,
    #             end_time__gte=curr_time
    #         )
    #     return queryset
    def filter_ongoing(self, queryset, name, value):
        if value:
            curr_datetime = now()
            curr_date = curr_datetime.date()
            curr_time = curr_datetime.time()
            
            ongoing_events = queryset.filter(
                is_published=True,
                revenue_distributed=False
            ).filter(
                Q(end_date__gt=curr_date)
            )
            
            return ongoing_events
        return queryset
    
    def filter_drafted(self, queryset, name, value):
        if value:
            return queryset.filter(is_draft=True)
        return queryset
    
class ParticipantedEventsFilter(django_filters.FilterSet):
    time_filter = django_filters.CharFilter(method='filter_by_time')
    category = django_filters.CharFilter(field_name='event_type', lookup_expr='iexact')
    start_date = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')

    class Meta:
        model = Event
        fields = ['time_filter', 'category', 'start_date', 'end_date']

    def filter_by_time(self, queryset, name, value):
        today = now().date()

        if value.lower() == 'all':
            return queryset
        elif value.lower() == 'today':
            return queryset.filter(start_date=today)
        elif value.lower() == 'week':
            start_week = today - timedelta(days=today.weekday())
            end_week = start_week + timedelta(days=6)
            return queryset.filter(start_date__range=[start_week, end_week])
        elif value.lower() == 'month':
            return queryset.filter(start_date__year=today.year, start_date__month=today.month)
        return queryset