from rest_framework.views import APIView
from .paginations import *
from rest_framework.permissions import IsAuthenticated
from event.models import *
import django_filters
from .filters import *
from .serializers import *
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from users.models import Profile, Booking, TicketRefund
from Admin.models import RevenueDistribution
from event.models import Event, Ticket
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate

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
        
class UserProfileDetails(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            username = request.query_params.get('username')
            if not username:
                return Response({"error": "Username is required."}, status=status.HTTP_404_NOT_FOUND)
            
            user = get_object_or_404(Profile, username=username)
            serializer = UserProfileSerializer(user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response({"error":"Failed to load the data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            username = request.data.get("username")
            follow_action = request.data.get("follow")

            if username is None or follow_action is None:
                return Response( {"error": "Username and follow status are required."},
                                status=status.HTTP_400_BAD_REQUEST )

            followed_user = get_object_or_404(Profile, username=username)

            if followed_user == request.user:
                return Response( {"error": "You cannot follow yourself."},
                                status=status.HTTP_400_BAD_REQUEST )

            follow_exists = Follow.objects.filter(follower=request.user, followed=followed_user).exists()

            if follow_action is True:
                if follow_exists:
                    return Response( {"error": "Already following this user."},
                                    status=status.HTTP_400_BAD_REQUEST)
                follow = Follow.objects.create(follower=request.user, followed=followed_user)
                return Response( {"message": "Following successfully!"},
                                status=status.HTTP_201_CREATED )

            elif follow_action is False:
                if not follow_exists:
                    return Response( {"error": "You are not following this user."}, 
                                    status=status.HTTP_400_BAD_REQUEST )
                Follow.objects.filter(follower=request.user, followed=followed_user).delete()
                return Response( {"message": "Unfollowed successfully."},
                                status=status.HTTP_200_OK )

            else:
                return Response( {"error": "Invalid follow status. Use true for follow, false for unfollow."},
                                status=status.HTTP_400_BAD_REQUEST )

        except Exception as e:
            return Response( {"error": "An unexpected error occurred"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR )
            
class ParticipatedList(APIView):
    pagination_class = OrganizedListPagination
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            event_ids = Booking.objects.filter(
                user=user,
                ticket_purchases__isnull=False
            ).values_list('event_id', flat=True).distinct()

            queryset = Event.objects.filter(id__in=event_ids)

            filtered_queryset = ParticipantedEventsFilter(request.GET, queryset=queryset).qs

            paginator = self.pagination_class()
            page = paginator.paginate_queryset(filtered_queryset, request)
            serializer = ParticipatedEventSerializer(page, many=True)

            return paginator.get_paginated_response(serializer.data)

        except Exception as e:
            print("Error:", e)
            return Response({"error": "Data not found"}, status=status.HTTP_400_BAD_REQUEST)

class EventOngoingData(APIView):
    def get(self, request, event_id):
        try:
          
            event = Event.objects.get(id=event_id)
 
            start_range = event.published_at
            end_range = event.start_date
          
            def generate_date_range(start_date, end_date):
                dates = []
                current_date = start_date
                while current_date <= end_date:
                    dates.append(current_date)
                    current_date += timedelta(days=1)
                return dates
            
            all_dates = generate_date_range(start_range, end_range)
            
            ticket_stats = {}
            
            tickets = Ticket.objects.filter(event=event)
            
            for ticket in tickets:
                ticket_type_lower = ticket.ticket_type.lower()
              
                purchases_data = TicketPurchase.objects.filter(
                    event=event,
                    ticket=ticket,
                    purchased_at__date__gte=start_range,
                    purchased_at__date__lte=end_range
                ).annotate(
                    date=TruncDate('purchased_at')
                ).values('date').annotate(
                    purchases_amount=Sum('total_price'),
                    purchases_users=Sum('quantity'),
                    purchase_count=Count('id')
                ).order_by('date')
                
                refunds_data = TicketRefund.objects.filter(
                    event=event,
                    ticket_type=ticket.ticket_type,
                    refunded_at__date__gte=start_range,
                    refunded_at__date__lte=end_range
                ).annotate(
                    date=TruncDate('refunded_at')
                ).values('date').annotate(
                    cancellations_amount=Sum('amount'),
                    cancellations_users=Sum('quantity'),
                    refund_count=Count('id')
                ).order_by('date')
              
                purchases_by_date = {
                    item['date']: {
                        'amount': float(item['purchases_amount'] or 0),
                        'users': int(item['purchases_users'] or 0)
                    } for item in purchases_data
                }
                refunds_by_date = {
                    item['date']: {
                        'amount': float(item['cancellations_amount'] or 0),
                        'users': int(item['cancellations_users'] or 0)
                    } for item in refunds_data
                }
              
                details = []
                total_purchases = 0
                total_cancellations = 0
                
                for date in all_dates:
                    purchase_data = purchases_by_date.get(date, {'amount': 0, 'users': 0})
                    cancellation_data = refunds_by_date.get(date, {'amount': 0, 'users': 0})
                    
                    details.append({
                        "date": date.strftime('%Y-%m-%d'),
                        "purchases": purchase_data['amount'],
                        "purchasesUsers": purchase_data['users'],
                        "cancellations": cancellation_data['amount'],
                        "cancellationsUsers": cancellation_data['users']
                    })
                    
                    total_purchases += purchase_data['amount']
                    total_cancellations += cancellation_data['amount']
               
                revenue = total_purchases - total_cancellations
             
                ticket_stats[ticket_type_lower] = {
                    "details": details,
                    "totalPurchases": total_purchases,
                    "totalCancellations": total_cancellations,
                    "revenue": revenue
                }
            
            total_revenue = sum(stats['revenue'] for stats in ticket_stats.values())
            total_purchases_amount = sum(stats['totalPurchases'] for stats in ticket_stats.values())
            total_cancellations_amount = sum(stats['totalCancellations'] for stats in ticket_stats.values())
            
            total_participants = 0
            for ticket in tickets:
                purchased_tickets = TicketPurchase.objects.filter(
                    event=event, 
                    ticket=ticket,
                    purchased_at__date__gte=start_range,
                    purchased_at__date__lte=end_range
                ).aggregate(total=Sum('quantity'))['total'] or 0
                
                refunded_tickets = TicketRefund.objects.filter(
                    event=event, 
                    ticket_type=ticket.ticket_type,
                    refunded_at__date__gte=start_range,
                    refunded_at__date__lte=end_range
                ).aggregate(total=Sum('quantity'))['total'] or 0
                
                total_participants += (purchased_tickets - refunded_tickets)
            
            total_limit = event.capacity
            
            response_data = {
                "eventId": str(event.id),
                "dateRange": {
                    "startDate": start_range.strftime('%Y-%m-%d'),
                    "endDate": end_range.strftime('%Y-%m-%d')
                },
                "ticketStats": ticket_stats,
                "summary": {
                    "totalRevenue": total_revenue,
                    "totalParticipants": total_participants,
                    "totalLimit": total_limit,
                    "totalPurchases": total_purchases_amount,
                    "totalCancellations": total_cancellations_amount
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Event.DoesNotExist:
            return Response( {"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND )
        except Exception as e:
            return Response( {"error": str(e)},  status=status.HTTP_500_INTERNAL_SERVER_ERROR )