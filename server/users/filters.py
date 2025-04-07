import django_filters
from event.models import Event
from django.utils import timezone

class EventFilterDistribution(django_filters.FilterSet):
    revenue_distributed = django_filters.BooleanFilter(field_name='revenue_distributed')
    end_date__lt = django_filters.DateFilter(field_name='end_date', lookup_expr='lt')
    is_published = django_filters.BooleanFilter(field_name='is_published')

    class Meta:
        model = Event
        fields = ['revenue_distributed', 'end_date__lt', 'is_published']