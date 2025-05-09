from rest_framework.views import APIView
from .paginations import *
from rest_framework.permissions import IsAuthenticated
from event.models import *
import django_filters
from .filters import *
from .serializers import *
from rest_framework.response import Response
from rest_framework import status

class OrganizedList(APIView):
    pagination_class = OrganizedListPagination
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            user = request.user
            queryset = Event.objects.filter(organizer=user)

            filtered_queryset = OrganizerEventsFilter(request.query_params, queryset=queryset).qs

            paginator = self.pagination_class()
            page = paginator.paginate_queryset(filtered_queryset, request)
            serialized_data = EventOrganizerList(page, many=True)

            return paginator.get_paginated_response(serialized_data.data)
        except Exception as e:
            print(e)
            return Response({"error": "datas not found"}, status=status.HTTP_400_BAD_REQUEST)