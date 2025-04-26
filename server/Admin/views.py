from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status, generics
from rest_framework.decorators import action
from .models import (OrganizerRequest, Coupon, Badge, UserBadge, RevenueDistribution, SubscriptionPlan, UserSubscription, SubscriptionTransaction)
from users.models import Profile, Booking, WalletTransaction
from .serializers import (OrganizerRequestSerializer, ProfileSerializer, ProfileSerializerAdmin, CouponSerializer,
                          BadgeSerializer, UserBadgeSerializer, RevenueDistributionSerializer, RevenueSummarySerializer,
                          BookingSerializerHistory, RefundHistorySerializer, SubscriptionPlanSerializer,
                          UserSubscriptionSerializer, EventSerializer)
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination, LimitOffsetPagination
from django.db import transaction
from django.db.models import Q
import cloudinary.uploader
from .filters import (RevenueDistributionFilter, BookingFilterHistory, RefundHistoryFilter, UsersSubscriptionFilter,
                      EventFilter, SubscriptionAnalyticsFilter)
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import RevenueDistributionSerializer
from django.db.models import Sum, Count
from datetime import datetime, timedelta
from .paginations import BookingPaginationHistory, RefundHistoryPagination, SubscriptionPagination
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.viewsets import ModelViewSet
from event.models import Event
from .permissions import IsAdminUser
from users.permissions import IsActiveUser
import logging
from django.db.models.functions import TruncDate
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import Table, TableStyle, Paragraph, SimpleDocTemplate, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from django.http import HttpResponse

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def admin_login(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'success': False, "error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username = username, password = password)
        print(user)
        if not user.is_staff:
            return Response({"success": False, "error": "You are not authorized to access the admin"}, status=status.HTTP_403_FORBIDDEN)
        
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response({
            "success": True, "role" : "admin"
        })
        response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="None", path="/")
        response.set_cookie("refresh_token", str(refresh), httponly=True, secure=True, samesite="None", path="/")
        
        return response
    except Exception as e:
        return Response({"success": False, "error": e})
    
    
# Pagination classes
class StandardPageNumberPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50

class StandardLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 5
    max_limit = 50

class OrganizerRequestList(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        search = request.query_params.get('search', None)
        status_filter = request.query_params.get('status', None)
        pagination_type = request.query_params.get('pagination', 'page') 

        queryset = OrganizerRequest.objects.all()
 
        if search:
            queryset = queryset.filter(
                user__username__icontains=search
            ) | queryset.filter(
                user__email__icontains=search
            )
        
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        if pagination_type == 'limit':
            paginator = StandardLimitOffsetPagination()
        else:
            paginator = StandardPageNumberPagination()
            
        page = paginator.paginate_queryset(queryset, request)
        serializer = OrganizerRequestSerializer(page, many=True)
        
        print(serializer.data)
        
        return paginator.get_paginated_response(serializer.data)

class OrganizerRequestUpdateStatus(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            organizer_request = OrganizerRequest.objects.get(pk=pk)
            new_status = request.data.get('status')
            admin_notes = request.data.get('admin_notes', '')
            current_status = organizer_request.status
            print('admin status ', new_status)

            valid_statuses = dict(OrganizerRequest._meta.get_field('status').choices)
            if new_status not in valid_statuses:
                return Response(
                    {'error': 'Invalid status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if current_status == 'approved':
                return Response({'error': 'User is already approved. Status cannot be changed.'}, status=status.HTTP_400_BAD_REQUEST)
                
            with transaction.atomic():
                organizer_request.status = new_status
                organizer_request.handled_at = timezone.now()
                organizer_request.admin_notes = admin_notes
                organizer_request.save()

                user_profile = organizer_request.user
                
                if new_status == 'approved': 
                    user_profile.organizerVerified = True
                elif new_status == 'rejected':
                    user_profile.organizerVerified = False
                user_profile.save()
                
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"organizer_{user_profile.id}",
                    {
                        "type": "status_update",
                        "status": new_status,
                        "admin_notes": admin_notes,
                        "organizerVerified": user_profile.organizerVerified,
                        }
                )
                   
            serializer = OrganizerRequestSerializer(organizer_request)
            return Response(serializer.data)
        except OrganizerRequest.DoesNotExist:
            return Response(
                {'error': 'Request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class OrganizerRequestBulkUpdate(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        new_status = request.data.get('status')
        print("new status ", new_status)

        if not ids or not isinstance(ids, list):
            return Response(
                {'error': 'Invalid or missing IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = dict(OrganizerRequest._meta.get_field('status').choices)
        if new_status not in valid_statuses:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        requests = OrganizerRequest.objects.filter(id__in=ids).exclude(status="approved")
        updated_count = requests.update(
            status=new_status,
            handled_at=timezone.now()
        )

        return Response({
            'message': f'Updated {updated_count} requests'
        })

class OrganizerRequestUserDetails(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            organizer_request = OrganizerRequest.objects.get(pk=pk)
            serializer = ProfileSerializer(organizer_request.user)
            return Response(serializer.data)
        except OrganizerRequest.DoesNotExist:
            return Response(
                {'error': 'Request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            
            
class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        search = request.query_params.get('search', None)
        status_filter = request.query_params.get('status', None)
        role_filter = request.query_params.get('role', None)

        queryset = Profile.objects.all()

        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )
        
        if status_filter and status_filter != 'all':
            is_active = status_filter.lower() == 'active'
            queryset = queryset.filter(is_active=is_active)
        
        if role_filter and role_filter != 'all':
            if role_filter.lower() == 'admin':
                queryset = queryset.filter(is_staff=True)
            elif role_filter.lower() == 'user':
                queryset = queryset.filter(is_staff=False)

        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProfileSerializerAdmin(page, many=True)
        print(serializer.data)
        
        return paginator.get_paginated_response(serializer.data)

class UserUpdateStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = Profile.objects.get(pk=pk)
            is_active = request.data.get('is_active')
            if is_active is None:
                return Response({'error': 'is_active field is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_active = is_active
            user.save()
            serializer = ProfileSerializerAdmin(user)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserBulkUpdateStatusView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        is_active = request.data.get('is_active', None)

        if not ids or is_active is None:
            return Response({'error': 'Invalid request: ids and is_active required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        users = Profile.objects.filter(id__in=ids)
        updated_count = users.update(is_active=is_active)
        
        return Response({'message': f'Updated {updated_count} users'})



# class CoupnList(APIView):
#     permission_classes = [IsAdminUser]
    
#     def get(self, request):
#         coupons = Coupon.objects.all()
#         serializer = CouponSerializer(coupons, many=True)
#         return Response(serializer.data)
    
#     def post(self, request):
#         serializer = CouponSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
from django.shortcuts import get_object_or_404
class CouponList(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Get query parameters
        search = request.query_params.get('search', None)
        status_filter = request.query_params.get('status', None)
        discount_type_filter = request.query_params.get('discount_type', None)

        # Base queryset
        queryset = Coupon.objects.all()

        # Apply search filter (code or title)
        if search:
            queryset = queryset.filter(
                code__icontains=search
            ) | queryset.filter(
                title__icontains=search
            )

        # Apply status filter
        if status_filter and status_filter != 'all':
            is_active = status_filter.lower() == 'active'
            queryset = queryset.filter(is_active=is_active)

        # Apply discount type filter
        if discount_type_filter and discount_type_filter != 'all':
            queryset = queryset.filter(discount_type=discount_type_filter.lower())

        # Paginate the queryset
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = CouponSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = CouponSerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data.get('code')
            if Coupon.objects.filter(code=code).exists():
                return Response({"error":"This coupon is already taken. Please choose a different code."},
                                status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class CouponDetail(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        serializer = CouponSerializer(coupon)
        return Response(serializer.data)

    def put(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        coupon.delete()
        return Response(status=status.HTTP_200_OK)

class CouponBulkUpdateStatus(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        is_active = request.data.get('is_active', None)

        if not ids or is_active is None:
            return Response({'error': 'Invalid request: ids and is_active required'}, 
                           status=status.HTTP_400_BAD_REQUEST)

        coupons = Coupon.objects.filter(id__in=ids)
        updated_count = coupons.update(is_active=is_active)
        
        return Response({'message': f'Updated {updated_count} coupons'})
 
 

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class BadgeListCreateView(APIView):
    pagination_class = CustomPagination

    def get(self, request):
        role = request.query_params.get('role', 'all')
        category = request.query_params.get('category', 'all')
        criteria_type = request.query_params.get('criteria_type', 'all')
        is_active = request.query_params.get('is_active', None)
        
        badges = Badge.objects.all()
        if role != 'all':
            badges = badges.filter(applicable_role=role)
        if category != 'all':
            badges = badges.filter(category=category)
        if criteria_type != 'all':
            badges = badges.filter(criteria_type=criteria_type)
        if is_active is not None:
            badges = badges.filter(is_active=is_active.lower() == 'true')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(badges, request)
        serializer = BadgeSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        mutable_data = request.data.copy()
        icon = request.FILES.get("icon")
        if icon:
            try:
                upload_result = cloudinary.uploader.upload(icon)
                mutable_data["icon"] = upload_result["url"]
            except Exception as e:
                return Response({"error":"Icon upload failed"}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = BadgeSerializer(data=mutable_data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success":True},status=status.HTTP_201_CREATED)
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BadgeDetailView(APIView):
    def get_object(self, pk):
        try:
            return Badge.objects.get(pk=pk)
        except Badge.DoesNotExist:
            return None

    def get(self, request, pk):
        badge = self.get_object(pk)
        if badge is None:
            return Response({"error":"Badge not found"},status=status.HTTP_404_NOT_FOUND)
        serializer = BadgeSerializer(badge)
        return Response(serializer.data)

    def put(self, request, pk):
        badge = self.get_object(pk)
        if badge is None:
            return Response({"error":"Badge not found"},status=status.HTTP_404_NOT_FOUND)
        mutable_data = request.data.copy()
        icon = request.FILES.get("icon")
        if icon:
            try:
                upload_result = cloudinary.uploader.upload(icon)
                mutable_data["icon"] = upload_result["url"]
            except Exception as e:
                return Response({"error":"Icon update failed"},status=status.HTTP_400_BAD_REQUEST)
        serializer = BadgeSerializer(badge, data=mutable_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserBadgeListView(APIView):
    pagination_class = CustomPagination

    def get(self, request):
        search = request.query_params.get('search', '')
        user_badges = UserBadge.objects.all()
        
        if search:
            user_badges = user_badges.filter(
                Q(user__username__icontains=search) | 
                Q(badge__name__icontains=search)
            )
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(user_badges, request)
        serializer = UserBadgeSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)


class RevenueDistributionPagiantion(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
class RevenueDistributionListView(generics.ListAPIView):
    queryset = RevenueDistribution.objects.all()
    serializer_class = RevenueDistributionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = RevenueDistributionFilter
    pagination_class = RevenueDistributionPagiantion

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('event', 'event__organizer').order_by('-distributed_at')
    
class RevenueSummaryView(APIView):
    def get(self, request):
        queryset = RevenueDistribution.objects.all()
        
        filterset = RevenueDistributionFilter(request.GET, queryset=queryset)
        if filterset.is_valid():
            queryset = filterset.qs
   
        total_revenue = queryset.aggregate(Sum('total_revenue'))['total_revenue__sum'] or 0
        today_revenue = queryset.filter(
            distributed_at__date=datetime.now().date()
        ).aggregate(Sum('total_revenue'))['total_revenue__sum'] or 0
        monthly_revenue = queryset.filter(
            distributed_at__year=datetime.now().year,
            distributed_at__month=datetime.now().month
        ).aggregate(Sum('total_revenue'))['total_revenue__sum'] or 0
        
        data = {
            'total_revenue': total_revenue,
            'today_revenue': today_revenue,
            'monthly_revenue': monthly_revenue,
        }
        
        serializer = RevenueSummarySerializer(data)
        return Response(serializer.data)
    
class TransactionHistoryListView(generics.ListAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializerHistory
    filter_backends = [DjangoFilterBackend]
    filterset_class = BookingFilterHistory
    pagination_class = BookingPaginationHistory
    
    def get_queryset(self):
        return Booking.objects.select_related('user', 'event').prefetch_related('ticket_purchases').order_by('-created_at')

class RefundHistoryListView(generics.ListAPIView):
    serializer_class = RefundHistorySerializer
    filterset_class = RefundHistoryFilter
    pagination_class = RefundHistoryPagination

    def get_queryset(self):
        try:
            queryset = WalletTransaction.objects.filter(
                transaction_type='REFUND'
            ).select_related(
                'wallet__user',
                'booking__event'
            ).prefetch_related(
                'refund_details'
            ).order_by('-created_at')
            return queryset
        except Exception as e:
            logger.error(f"RefundHistoryListView {str(e)}")
            return WalletTransaction.objects.none()

class SubscriptionPlanViewset(ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    
class UserSubscriptionListView(generics.ListAPIView):
    queryset = UserSubscription.objects.select_related('user', 'plan').all().order_by('-start_date')
    serializer_class = UserSubscriptionSerializer
    pagination_class = SubscriptionPagination
    filterset_class = UsersSubscriptionFilter
    
@api_view(['POST'])
@permission_classes([IsAdminUser])
def UserSubscriptionStatus(request, pk):
    try:
        sub = UserSubscription.objects.get(pk=pk)
        sub.is_active = not sub.is_active
        sub.save()
        return Response({"success": True, "message": "Subscription status updated.", "is_active": sub.is_active})
    except UserSubscription.DoesNotExist:
        return Response({"success": False, "error": "Subscription not found."}, status=status.HTTP_404_NOT_FOUND)

class SubscriptionAnalytics(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        subscriptions_qs = UserSubscription.objects.all()
        subscriptions_filter = SubscriptionAnalyticsFilter(request.query_params, queryset=subscriptions_qs)
        filtered_subscriptions = subscriptions_filter.qs
        
        transactions_qs = SubscriptionTransaction.objects.all()
        if 'time_range' in request.query_params:
            today = timezone.now()
            time_range = request.query_params['time_range']
            if time_range == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
            elif time_range == 'week':
                start_date = today - timedelta(days=today.weekday())
            elif time_range == 'month':
                start_date = today.replace(day=1)
            else: 
                start_date = today.replace(month=1, day=1)
            transactions_qs = transactions_qs.filter(transaction_date__gte=start_date)
        
        if 'plan_type' in request.query_params:
            plan_type = request.query_params['plan_type']
            transactions_qs = transactions_qs.filter(subscription__plan__name=plan_type)

        revenue = transactions_qs.aggregate(
            basic=Sum('amount', filter=Q(subscription__plan__name='basic')),
            premium=Sum('amount', filter=Q(subscription__plan__name='premium')))

        growth_data = filtered_subscriptions.annotate(
            date=TruncDate('start_date')
        ).values('date', 'plan__name').annotate(
            count=Count('id')
        ).order_by('date')

        labels = []
        basic_data = []
        premium_data = []
        
        if filtered_subscriptions.exists():
            start_date = filtered_subscriptions.order_by('start_date').first().start_date
            end_date = timezone.now()
            
            current_date = start_date
            while current_date <= end_date:
                date_str = current_date.strftime('%Y-%m-%d')
                labels.append(date_str)
                
                daily_data = growth_data.filter(date=current_date.date())
                basic_count = daily_data.filter(plan__name='basic').first()
                premium_count = daily_data.filter(plan__name='premium').first()
                
                basic_data.append(basic_count['count'] if basic_count else 0)
                premium_data.append(premium_count['count'] if premium_count else 0)
                
                current_date += timedelta(days=1)

        transaction_counts = transactions_qs.values('transaction_type').annotate(count=Count('id'))
        transaction_data = {
            'purchase': 0,
            'renewal': 0,
            'upgrade': 0
        }
        for item in transaction_counts:
            transaction_data[item['transaction_type']] = item['count']

        return Response({
            'totalRevenue': {
                'basic': float(revenue['basic'] or 0),
                'premium': float(revenue['premium'] or 0)
            },
            'growthData': {
                'labels': labels,
                'basic': basic_data,
                'premium': premium_data
            },
            'transactionData': transaction_data,
            'transactions': list(transactions_qs.order_by('-transaction_date').values(
                'id', 'amount', 'transaction_type', 'transaction_date',
                'subscription__user__username', 'subscription__plan__name'
            )[:50])
        })
        
class EventList(APIView):
    permission_classes = [AllowAny]
    filterset_class = EventFilter
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminUser]
                
    def get(self, request):
        try:
            queryset = Event.objects.filter(is_published=True).select_related('organizer').order_by('-created_at')
            filterset = self.filterset_class(request.GET, queryset=queryset)

            if not filterset.is_valid():
                return Response({"success": "error","message": "Invalid filters","errors": filterset.errors},
                    status=status.HTTP_400_BAD_REQUEST)

            serializer = EventSerializer(filterset.qs, many=True)
            return Response({"success": True,"events": serializer.data },status=status.HTTP_200_OK)

        except Exception as e:
            return Response({ "success": "error","message": f"Failed to fetch events {str(e)}",},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExportRevenuePDF(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        params = request.query_params
        queryset = RevenueDistribution.objects.all()
        
        filterset = RevenueDistributionFilter(params, queryset=queryset)
        if filterset.is_valid():
            queryset = filterset.qs

        revenue_data = queryset.select_related('event', 'event__organizer').order_by('-distributed_at')
        
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        elements = []
        
        title_style = styles['Title']
        elements.append(Paragraph("Revenue Distribution Report", title_style))
        
        current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        info_style = styles['Normal']
        info_style.fontSize = 10
        info_style.spaceBefore = 6
        
        elements.append(Paragraph(f"Generated on: {current_date}", info_style))
        elements.append(Paragraph(f"Date Range: {params.get('date_range', 'All Time').capitalize()}", info_style))
        
        if params.get('start_date'):
            elements.append(Paragraph(f"From: {params.get('start_date')}", info_style))
        if params.get('end_date'):
            elements.append(Paragraph(f"To: {params.get('end_date')}", info_style))
        if params.get('event_type'):
            elements.append(Paragraph(f"Event Type: {params.get('event_type')}", info_style))
        
        elements.append(Spacer(1, 20))
        
        table_width = landscape(letter)[0] - 72
        col_widths = [
            table_width * 0.13,
            table_width * 0.12,  
            table_width * 0.10,  
            table_width * 0.12,
            table_width * 0.10,
            table_width * 0.08,
            table_width * 0.12,
            table_width * 0.12, 
            table_width * 0.11,  
        ]
        
        data = [
            [
                "Event", "Organizer", "Type", 
                "Total Revenue", "Participants", 
                "Admin %", "Admin Amount", 
                "Organizer Amount", "Date"
            ]
        ]

        for item in revenue_data:
            data.append([
                item.event.event_title,
                item.event.organizer.username,
                item.event.event_type,
                f"${item.total_revenue:.2f}",
                str(item.total_participants),
                f"{item.admin_percentage}%",
                f"${item.admin_amount:.2f}",
                f"${item.organizer_amount:.2f}",
                item.distributed_at.strftime("%Y-%m-%d")
            ])
        
        table = Table(data, colWidths=col_widths)
        
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8), 
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            
            ('ALIGN', (3, 1), (3, -1), 'RIGHT'), 
            ('ALIGN', (4, 1), (4, -1), 'CENTER'), 
            ('ALIGN', (5, 1), (5, -1), 'CENTER'), 
            ('ALIGN', (6, 1), (6, -1), 'RIGHT'), 
            ('ALIGN', (7, 1), (7, -1), 'RIGHT'), 
            ('ALIGN', (8, 1), (8, -1), 'CENTER'), 
            
            *[('BACKGROUND', (0, i), (-1, i), colors.HexColor("#eef2ff")) for i in range(2, len(data), 2)]
        ]))
        
        elements.append(table)
        
        elements.append(Spacer(1, 20))
        
        total_revenue = sum(item.total_revenue for item in revenue_data)
        total_admin = sum(item.admin_amount for item in revenue_data)
        total_organizer = sum(item.organizer_amount for item in revenue_data)

        summary_style = styles['Heading2']
        elements.append(Paragraph("Summary", summary_style))
        
        summary_table_data = [
            ["Total Revenue:", f"{total_revenue:.2f}"],
            ["Total Admin Share:", f"{total_admin:.2f}"],
            ["Total Organizer Share:", f"{total_organizer:.2f}"],
            ["Total Events:", str(len(revenue_data))]
        ]
        
        summary_table = Table(summary_table_data, colWidths=[100, 100])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(summary_table)
        
        doc.build(elements)
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"revenue_report_{datetime.now().strftime('%Y-%m-%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response