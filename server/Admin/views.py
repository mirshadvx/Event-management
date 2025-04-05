from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from .models import OrganizerRequest, Coupon, Badge, UserBadge
from users.models import Profile
from .serializers import (OrganizerRequestSerializer, ProfileSerializer, ProfileSerializerAdmin, CouponSerializer,
                          BadgeSerializer, UserBadgeSerializer)
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination, LimitOffsetPagination
from django.db import transaction
from django.db.models import Q
import cloudinary.uploader



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
        # Get query parameters
        search = request.query_params.get('search', None)
        status_filter = request.query_params.get('status', None)
        pagination_type = request.query_params.get('pagination', 'page')  # 'page' or 'limit'

        # Base queryset
        queryset = OrganizerRequest.objects.all()

        # Apply filters
        if search:
            queryset = queryset.filter(
                user__username__icontains=search
            ) | queryset.filter(
                user__email__icontains=search
            )
        
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        # Apply pagination
        if pagination_type == 'limit':
            paginator = StandardLimitOffsetPagination()
        else:
            paginator = StandardPageNumberPagination()

        # Paginate the queryset
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
            print('admin status ', new_status)

            valid_statuses = dict(OrganizerRequest._meta.get_field('status').choices)
            if new_status not in valid_statuses:
                return Response(
                    {'error': 'Invalid status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            with transaction.atomic():
                # Update OrganizerRequest
                organizer_request.status = new_status
                organizer_request.handled_at = timezone.now()
                organizer_request.admin_notes = admin_notes
                organizer_request.save()

                # Update related user's Profile
                # Assuming organizer_request has a user field linking to Profile
                user_profile = organizer_request.user  # Adjust this based on your actual field name
                
                if new_status == 'approved': 
                    user_profile.organizerVerified = True
                elif new_status == 'rejected':
                    user_profile.organizerVerified = False
                user_profile.save()

            # organizer_request.status = new_status
            # organizer_request.handled_at = timezone.now()
            # organizer_request.admin_notes = admin_notes
            # organizer_request.save()
            
            # profile = organizer_request.user
            # if new_status == 'approved':
            #     profile.organizerVerified = True
            # elif new_status == 'rejected':
            #     profile.organizerVerified = False
            # profile.save()
                   
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

        requests = OrganizerRequest.objects.filter(id__in=ids)
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
        # Get filter parameters
        role = request.query_params.get('role', 'all')
        category = request.query_params.get('category', 'all')
        criteria_type = request.query_params.get('criteria_type', 'all')
        
        # Build queryset with filters
        badges = Badge.objects.all()
        if role != 'all':
            badges = badges.filter(applicable_role=role)
        if category != 'all':
            badges = badges.filter(category=category)
        if criteria_type != 'all':
            badges = badges.filter(criteria_type=criteria_type)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(badges, request)
        serializer = BadgeSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        print('***',request.data)
        mutable_data = request.data.copy()
        icon = request.FILES.get("icon")
        print(icon,"####")
        if icon:
            try:
                upload_result = cloudinary.uploader.upload(icon)
                mutable_data["icon"] = upload_result["url"]
                print("**",mutable_data)
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