from django.shortcuts import render
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import (
    UserRegistrationSerializer,
    OTPVarificationSerializer,
    UserProfileSerializer,
    ProfileEventJoinedSerializer,
    WalletSerializer,
    WalletTransactionSerializer,
    SubscriptionPlanSerializer,
    ProfileEventJoinedSerializer,
    UserPlanDetailsSerializer,
    SubscriptionTransactionSerializer,
)
from rest_framework import status
import redis
from decouple import config
import random
import json
from django.core.mail import send_mail
from .models import (
    Profile,
    UserSettings,
    SocialMediaLink,
    Wallet,
    WalletTransaction,
    Booking,
    PasswordResetToken,
    TicketRefund,
)
from Admin.models import (
    OrganizerRequest,
    Coupon,
    SubscriptionPlan,
    UserSubscription,
    SubscriptionTransaction,
)
from event.models import Event, TicketPurchase, Ticket
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from .firebase import auth as firebase_auth
import jwt
import cloudinary.uploader
from datetime import date
import datetime
import time
from django.template.loader import render_to_string
from django.utils.html import strip_tags

User = get_user_model()
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
import uuid
import stripe
from datetime import datetime, timedelta
from django.db.models import Sum
from rest_framework.pagination import PageNumberPagination
import logging
from django.db import transaction
from django.conf import settings
from .tasks import send_user_notification
import os
import re
from .utils.coupon_utils import (
    validate_coupon,
    calculate_coupon_discount,
    validate_and_apply_coupon,
)
from django.core.exceptions import ValidationError
from .utils.payment_utils import handle_wallet_payment, handle_stripe_payment

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"), port=os.getenv("REDIS_PORT"), db=0
)


class CustomTokenObtainPairView(TokenObtainPairView):

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            tokens = response.data
            access_token = tokens["access"]
            refresh_token = tokens["refresh"]
            res = Response()
            res.data = {"success": True}
            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="None",
                path="/",
            )

            res.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite="None",
                path="/",
            )

            return res
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=400)


class CustomRefreshTokenView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get("refresh_token")
            request.data["refresh"] = refresh_token
            response = super().post(request, *args, **kwargs)
            tokens = response.data
            access_token = tokens["access"]
            res = Response()
            res.data = {"refreshtoken": True}
            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="None",
                path="/",
            )

            return res
        except:
            return Response()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        res = Response()
        res.data = {"success": True}
        res.delete_cookie("access_token", path="/", samesite="None")
        res.delete_cookie("refresh_token", path="/", samesite="None")
        return res
    except:
        return Response({"success": False, "error": "logout failed"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def is_authenticated(request):
    return Response({"authenticated": True})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        otp = str(random.randint(100000, 999999))

        temp_user_data = {
            "username": serializer.validated_data["username"],
            "email": serializer.validated_data["email"],
            "password": serializer.validated_data["password"],
            "otp": otp,
            "created_at": int(time.time()),
        }
        redis_client.setex(
            name=f"temp_user:{serializer.validated_data['email']}",
            time=settings.REDIS_TEMP_USER_KEEP_TIME,
            value=json.dumps(temp_user_data),
        )

        context = {
            "otp": otp,
            "current_date": date.today(),
        }
        html_message = render_to_string("email/otp_send.html", context)
        plain_message = strip_tags(html_message)
        send_mail(
            subject="Verify Your Email",
            message=plain_message,
            from_email=None,
            recipient_list=[serializer.validated_data["email"]],
            fail_silently=False,
            html_message=html_message,
        )
        return Response({"success": True, "message": "OTP sent to your email"})

    return Response({"success": False, "errors": serializer.errors})


@api_view(["GET"])
@permission_classes([AllowAny])
def check_username_exists(request):
    username = request.query_params.get("username", None)
    if username is None:
        return Response(
            {"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST
        )
    exists = Profile.objects.filter(username=username).exists()
    return Response({"exists": exists}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = OTPVarificationSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        temp_user_key = f"temp_user:{email}"
        temp_user_data = redis_client.get(temp_user_key)

        if not temp_user_data:
            return Response({"success": False, "error": "OTP expired or invalid"})

        temp_user = json.loads(temp_user_data)

        current_time = int(time.time())
        if current_time - temp_user["created_at"] > int(
            os.getenv("OTP_EXPIRY_SECONDS", 120)
        ):
            redis_client.delete(temp_user_key)
            return Response({"success": False, "error": "OTP expired"})

        if temp_user["otp"] != otp:
            return Response({"success": False, "error": "invalid OTP"})

        user = Profile(username=temp_user["username"], email=temp_user["email"])
        user.set_password(temp_user["password"])
        user.save()

        Wallet.objects.create(user=user)

        try:
            trial_plan = SubscriptionPlan.objects.get(name="trial", active=True)
            end_date = timezone.now() + timedelta(days=30)
            UserSubscription.objects.create(
                user=user,
                plan=trial_plan,
                start_date=timezone.now(),
                end_date=end_date,
                is_active=True,
            )
        except SubscriptionPlan.DoesNotExist:
            SubscriptionPlan.ensure_default_plans()
            trial_plan = SubscriptionPlan.objects.get(name="trial", active=True)
            end_date = timezone.now() + timedelta(days=30)
            UserSubscription.objects.create(
                user=user,
                plan=trial_plan,
                start_date=timezone.now(),
                end_date=end_date,
                is_active=True,
            )

        redis_client.delete(temp_user_key)

        return Response({"success": True, "message": "email varified!"})
    return Response({"success": False, "error": serializer.errors})


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def google_login(request):
    token = request.data.get("token")

    if not token:
        return Response(
            {"success": False, "error": "No token provided"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        decoded_token = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_exp": False,
                "verify_iat": False,
            },
        )
        test = firebase_auth.verify_id_token(token)

        email = decoded_token.get("email")
        name = decoded_token.get("name", email.split("@")[0])
        profile_picture = decoded_token.get("picture")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": name or email.split("@")[0],
                "profile_picture": profile_picture,
            },
        )
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response(
            {
                "success": True,
                "access_token": access_token,
                "refresh_token": str(refresh),
                "user": {
                    "email": user.email,
                    "username": user.username,
                    "profile_picture": user.profile_picture,
                },
            }
        )
        response.set_cookie(
            "access_token",
            access_token,
            httponly=True,
            secure=True,
            samesite="None",
            path="/",
        )
        response.set_cookie(
            "refresh_token",
            str(refresh),
            httponly=True,
            secure=True,
            samesite="None",
            path="/",
        )

        return response
    except Exception as e:
        return Response(
            {"success": False, "error": "Invalid token"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class get_user_profile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            serializer = UserProfileSerializer(user)
            return Response(
                {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )

    def patch(self, request):
        try:
            user = request.user
            serializer = UserProfileSerializer(
                user, data=request.data, partial=True, context={"request": request}
            )

            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"success": True, "data": serializer.data},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"success": False, "error": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            return Response(
                {"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class OrganizerRequestHandle(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            existing_request = OrganizerRequest.objects.filter(user=user).first()

            if existing_request:
                return Response(
                    {
                        "success": True,
                        "message": "Organizer request reinitialized successfully.",
                    },
                    status=status.HTTP_200_OK,
                )
            OrganizerRequest.objects.create(user=user)
            return Response(
                {
                    "success": True,
                    "message": "Organizer request submitted successfully.",
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class OrganizerRequestStatus(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            organizer_request_data = OrganizerRequest.objects.get(user=request.user)
            return Response(
                {
                    "success": True,
                    "status": organizer_request_data.status,
                    "admin_notes": organizer_request_data.admin_notes,
                    "organizerVarified": request.user.organizerVerified,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "failed to load details",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def UpdateProfileInfo(request):
    try:
        user = request.user
        profile = Profile.objects.get(id=user.id)

        username = request.data.get("username", profile.username)
        bio = request.data.get("bio", profile.bio)
        title = request.data.get("title", profile.title)
        phone = request.data.get("phone", profile.phone)
        location = request.data.get("location", profile.location)

        if not username.strip():
            return Response(
                {"success": False, "message": "Username cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if phone:
            if not re.fullmatch(r"\d{10}", phone):
                return Response(
                    {
                        "success": False,
                        "message": "Phone number must be exactly 10 digits.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if len(title) > 100:
            return Response(
                {"success": False, "message": "Title can't exceed 100 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(location) > 100:
            return Response(
                {"success": False, "message": "Location can't exceed 100 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if bio and len(bio) > 1000:
            return Response(
                {"success": False, "message": "Bio can't exceed 1000 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.username = username
        profile.bio = bio
        profile.title = title
        profile.phone = phone
        profile.location = location
        profile.save()

        return Response(
            {"success": True, "message": "Profile updated successfully"},
            status=status.HTTP_200_OK,
        )

    except Profile.DoesNotExist:
        return Response(
            {"success": False, "message": "Profile not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def UpdateProfilePicture(request):
    try:
        user = request.user
        if "profile_picture" in request.FILES:
            upload_result = cloudinary.uploader.upload(request.FILES["profile_picture"])
            user.profile_picture = upload_result["url"]
            user.save()

        return Response(
            {
                "success": True,
                "message": "Profile updated successfully",
                "url_picture": user.profile_picture,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"success": False, "message": f"Profile upload failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class CheckOrganizerStatus(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_profile = request.user
            response_data = {
                "success": True,
                "is_organizer": user_profile.organizerVerified,
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "is_organizer": user_profile.organizerVerified,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ApplyCouponAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("coupon_code")
        event_id = request.data.get("event_id")
        user = request.user
        try:
            coupon, event = validate_coupon(code, user, event_id)
            subtotal, discount = calculate_coupon_discount(coupon, event, request.data)
            return Response(
                {
                    "code": coupon.code,
                    "discount": discount,
                    "subtotal": subtotal,
                    "total": subtotal - discount,
                },
                status=status.HTTP_200_OK,
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            event_id = request.data.get("event_id")
            payment_method = request.data.get("payment_method")
            coupon_code = request.data.get("coupon_code")
            selected_tickets = request.data.get("selected_tickets", {})
            stripe_payment_method_id = request.data.get("stripe_payment_method_id")

            if not event_id or not payment_method or not selected_tickets:
                return Response(
                    {"error": "Missing required fields."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            event = get_object_or_404(Event, id=event_id, is_published=True)
            user = request.user

            # Check subscription limits for event joining
            try:
                subscription = UserSubscription.objects.get(user=user, is_active=True)

                if not subscription.can_join_event():
                    return Response(
                        {
                            "success": False,
                            "message": f"You have reached your monthly event joining limit ({subscription.plan.event_join_limit}). Upgrade your plan to join more events.",
                            "subscription_limit_reached": True,
                            "current_usage": subscription.events_joined_current_month,
                            "limit": subscription.plan.event_join_limit,
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except UserSubscription.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "message": "You need an active subscription to join events.",
                        "subscription_required": True,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            with transaction.atomic():
                subtotal = Decimal("0")
                ticket_purchases = []

                for ticket_type, quantity in selected_tickets.items():
                    if quantity <= 0:
                        continue

                    ticket = event.tickets.select_for_update().get(
                        ticket_type=ticket_type
                    )

                    if ticket.quantity - ticket.sold_quantity < quantity:
                        return Response(
                            {"error": f"Not enough {ticket_type} tickets available."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    subtotal += Decimal(ticket.price) * Decimal(quantity)

                coupon = None
                discount = Decimal("0")
                if coupon_code:
                    coupon, subtotal, discount = validate_and_apply_coupon(
                        coupon_code, user, event, selected_tickets
                    )

                total = subtotal - discount
                if total < 0:
                    total = Decimal("0")

                total_in_cents = int(total * 100)
                track_discount = subtotal - total

                booking = Booking.objects.create(
                    user=user,
                    event=event,
                    payment_method=payment_method,
                    subtotal=subtotal,
                    discount=discount,
                    total=total,
                    track_discount=track_discount,
                    coupon=coupon,
                )

                for ticket_type, quantity in selected_tickets.items():
                    if quantity <= 0:
                        continue

                    ticket = event.tickets.get(ticket_type=ticket_type)
                    ticket.sold_quantity += quantity
                    ticket.save()

                    qr_code = str(uuid.uuid4())
                    purchase = TicketPurchase.objects.create(
                        buyer=user,
                        event=event,
                        ticket=ticket,
                        quantity=quantity,
                        used_tickets=0,
                        total_price=Decimal(ticket.price) * Decimal(quantity),
                        unique_qr_code=qr_code,
                        booking_id=str(booking.booking_id),
                    )
                    booking.ticket_purchases.add(purchase)
                    ticket_purchases.append(
                        {
                            "ticket_type": ticket_type,
                            "quantity": quantity,
                            "qr_code": qr_code,
                        }
                    )

                if coupon:
                    coupon.used_count += 1
                    coupon.used_by.add(user)
                    coupon.save()

                if payment_method == "wallet":
                    handle_wallet_payment(user, total, booking, event.event_title)
                elif payment_method == "stripe":
                    payment_intent = handle_stripe_payment(
                        stripe_payment_method_id,
                        total_in_cents,
                        booking,
                        event.event_title,
                        user,
                        event_id,
                    )
                    if payment_intent.status == "requires_action":
                        return Response(
                            {
                                "requires_action": True,
                                "payment_intent_client_secret": payment_intent.client_secret,
                                "booking_id": str(booking.booking_id),
                            },
                            status=status.HTTP_200_OK,
                        )
                    elif payment_intent.status != "succeeded":
                        booking.delete()
                        return Response(
                            {"error": "Payment failed."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                try:
                    if hasattr(event, "group_chat") and event.group_chat:
                        event.group_chat.participants.add(user)
                        send_user_notification.delay(
                            user_id=user.id,
                            message=f"You entered {event.event_title} group chat",
                        )
                except Exception as e:
                    logger.error(f"Error adding user to group chat: {str(e)}")

                send_user_notification.delay(
                    user_id=user.id,
                    message=f"Booking successful for {event.event_title}",
                )

                # Increment subscription counter for event joining
                try:
                    subscription = UserSubscription.objects.get(
                        user=user, is_active=True
                    )
                    subscription.inc_joined_count()
                except UserSubscription.DoesNotExist:
                    pass  # Handle gracefully if subscription not found

                return Response(
                    {
                        "message": "Payment successful!",
                        "booking_id": str(booking.booking_id),
                        "total": str(total),
                        "ticket_purchases": ticket_purchases,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except stripe.error.CardError as e:
            if "booking" in locals():
                booking.delete()
            return Response(
                {"error": str(e.user_message)}, status=status.HTTP_400_BAD_REQUEST
            )
        except stripe.error.StripeError:
            if "booking" in locals():
                booking.delete()
            return Response(
                {"error": "Something went wrong with the payment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            if "booking" in locals():
                booking.delete()
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def joined_events(request):
    try:
        user = request.user
        current_time = datetime.now()

        future_bookings = (
            Booking.objects.filter(
                user=user,
                event__start_date__gt=current_time.date(),
                ticket_purchases__isnull=False,
            )
            .select_related("event")
            .prefetch_related("ticket_purchases__ticket")
        )

        today_bookings = (
            Booking.objects.filter(
                user=user,
                event__start_date=current_time.date(),
                event__start_time__gt=current_time.time(),
                ticket_purchases__isnull=False,
            )
            .select_related("event")
            .prefetch_related("ticket_purchases__ticket")
        )

        all_bookings = (
            (future_bookings | today_bookings).distinct().order_by("-created_at")
        )

        serializer = ProfileEventJoinedSerializer(
            all_bookings, many=True, context={"request": request}
        )
        return Response(serializer.data)

    except Exception as e:
        return Response(
            {"error": f"An error occurred while processing your request: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_ticket(request):
    try:
        user = request.user
        data = request.data
        event_id = data.get("event_id")
        booking_id = data.get("booking_id")
        tickets_to_cancel = data.get("tickets", [])

        try:
            che_event = Event.objects.get(id=event_id)
            if not che_event.cancel_ticket:
                return Response(
                    {"error": "Ticket cancellation is not allowed for this event."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Event.DoesNotExist:
            return Response(
                {"Event does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not event_id or not booking_id or not tickets_to_cancel:
            return Response(
                {"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST
            )

        booking = get_object_or_404(
            Booking, booking_id=booking_id, user=user, event__id=event_id
        )
        event = booking.event

        current_date = datetime.now().date()
        refund_deadline = event.start_date - timedelta(days=2)
        if current_date > refund_deadline:
            return Response(
                {
                    "error": "Cancellation only acceptable for before event start before 2 days!"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet = get_object_or_404(Wallet, user=user)

        all_ticket_purchases = TicketPurchase.objects.filter(
            event=event, buyer=user, booking_id=booking_id
        )
        
        if booking.subtotal > 0:
            payment_ratio = booking.total / booking.subtotal
        else:
            payment_ratio = Decimal("1.00")
        
        current_subtotal_from_purchases = sum(
            Decimal(str(tp.ticket.price)) * Decimal(str(tp.quantity)) 
            for tp in all_ticket_purchases
        )

        refund_amount = Decimal("0.00")
        canceled_subtotal = Decimal("0.00")
        canceled_tickets = []
        
        for ticket_data in tickets_to_cancel:
            ticket_id = ticket_data.get("ticket_id")
            cancel_quantity = ticket_data.get("quantity", 0)

            if not ticket_id or cancel_quantity <= 0:
                return Response(
                    {"error": "Invalid ticket_id or quantity."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ticket_purchase = get_object_or_404(
                TicketPurchase, id=ticket_id, buyer=user, event=event_id
            )

            if ticket_purchase not in booking.ticket_purchases.all():
                return Response(
                    {
                        "error": f"Ticket {ticket_id} does not belong to booking {booking_id}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if cancel_quantity > ticket_purchase.quantity:
                return Response(
                    {
                        "error": f"Cannot cancel more than {ticket_purchase.quantity} tickets for ticket {ticket_id}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ticket = ticket_purchase.ticket
            
            ticket_price_per_unit = Decimal(str(ticket.price))
            
            canceled_ticket_original_subtotal = ticket_price_per_unit * Decimal(str(cancel_quantity))
            canceled_subtotal += canceled_ticket_original_subtotal
            
            refund_for_ticket = (canceled_ticket_original_subtotal * payment_ratio).quantize(Decimal('0.01'))
            refund_amount += refund_for_ticket

            ticket.sold_quantity = max(0, ticket.sold_quantity - cancel_quantity)
            ticket.save()

            ticket_purchase.quantity -= cancel_quantity
            if ticket_purchase.quantity == 0:
                booking.ticket_purchases.remove(ticket_purchase)
                ticket_purchase.delete()
            else:
                ticket_purchase.total_price = ticket_price_per_unit * Decimal(str(ticket_purchase.quantity))
                ticket_purchase.save()

            canceled_tickets.append(
                {
                    "ticket_id": ticket_id,
                    "ticket_type": ticket.ticket_type,
                    "quantity": cancel_quantity,
                    "refund_amount": float(refund_for_ticket),
                }
            )

        current_subtotal_before_cancel = booking.subtotal
        
        booking.subtotal = max(Decimal("0.00"), booking.subtotal - canceled_subtotal)
        
        if current_subtotal_before_cancel > 0 and booking.track_discount > 0:
            canceled_discount = (canceled_subtotal / current_subtotal_before_cancel) * booking.track_discount
            booking.track_discount = max(Decimal("0.00"), booking.track_discount - canceled_discount.quantize(Decimal('0.01')))
        
        booking.total = max(Decimal("0.00"), booking.subtotal - booking.track_discount)
        booking.discount = booking.track_discount
        booking.save()

        final_refund_amount = refund_amount.quantize(Decimal('0.01'))

        if final_refund_amount > 0:
            wallet.balance += final_refund_amount
            wallet.save()

            transaction = WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type="REFUND",
                amount=final_refund_amount,
                description=f"Refund for canceled tickets from {event.event_title}",
                booking=booking,
            )

            for ticket_info in canceled_tickets:
                TicketRefund.objects.create(
                    wallet_transaction=transaction,
                    ticket_type=ticket_info["ticket_type"],
                    quantity=ticket_info["quantity"],
                    amount=Decimal(str(ticket_info["refund_amount"])).quantize(Decimal('0.01')),
                    event=event,
                    booking=booking,
                )

        return Response(
            {
                "success": True,
                "message": "Tickets canceled successfully.",
                "total_refund": float(final_refund_amount),
                "canceled_tickets": canceled_tickets,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in cancel_ticket: {str(e)}")
        return Response(
            {"error": "Failed to cancel ticket"}, status=status.HTTP_400_BAD_REQUEST
        )


class StandardPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = "page_size"
    max_page_size = 100


class WalletDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            wallet = Wallet.objects.get(user=request.user)
            transactions = WalletTransaction.objects.filter(wallet=wallet).order_by(
                "-created_at"
            )
            paginator = StandardPagination()
            paginated_transactions = paginator.paginate_queryset(transactions, request)

            wallet_seri = WalletSerializer(wallet)
            transaction_seri = WalletTransactionSerializer(
                paginated_transactions, many=True
            )

            response_data = {
                "wallet": {
                    "user": wallet_seri.data["user"],
                    "balance": wallet_seri.data["balance"],
                    "updated_at": wallet_seri.data["updated_at"],
                },
                "transactions": transaction_seri.data,
                "pagination": {
                    "count": paginator.page.paginator.count,
                    "next": paginator.get_next_link(),
                    "previous": paginator.get_previous_link(),
                },
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Wallet.DoesNotExist:
            return Response(
                {"error": "Wallet not found"}, status=status.HTTP_404_NOT_FOUND
            )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()

        if not email:
            return Response(
                {"success": False, "message": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"success": False, "message": "No user with this email exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = PasswordResetToken.objects.create(user=user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{token.token}"

        try:
            send_mail(
                subject="Password Reset Request",
                message=f"Click the link to reset you password: {reset_link}",
                from_email=None,
                recipient_list=[email],
            )
        except Exception as e:
            return Response(
                {"success": False, "message": "Failed to send email"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {"success": True, "message": "Reset email sent"}, status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token", "").strip()
        password = request.data.get("password", "").strip()

        if not token or not password:
            return Response(
                {"success": False, "message": "Token and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 6:
            return Response(
                {"success": False, "message": "Password must be at least 6 characters"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_expired():
                reset_token.delete()
                return Response(
                    {"success": False, "message": "Token has expired"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_token.user
        user.set_password(password)
        user.save()
        reset_token.delete()
        return Response(
            {"success": True, "message": "Password reset successfully"},
            status=status.HTTP_200_OK,
        )


class SubscriptionCheckout(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        try:
            include_trial = (
                request.query_params.get("include_trial", "false").lower() == "true"
            )

            plans_query = SubscriptionPlan.objects.filter(active=True)
            if not include_trial:
                plans_query = plans_query.exclude(name="trial")

            plans = plans_query
            serializer = SubscriptionPlanSerializer(plans, many=True)
            return Response(
                {"success": True, "plans": serializer.data}, status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error fetching plans: {str(e)}")
            return Response(
                {"success": False, "message": "Failed to load plans"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        user = request.user
        data = request.data
        plan_id = data.get("plan_id")
        payment_method = data.get("payment_method")

        if not plan_id or not payment_method:
            return Response(
                {
                    "success": False,
                    "message": "Missing required fields: plan_id and payment_method",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
            logger.info(
                f"Found plan: {plan.name}, price: {plan.price}, active: {plan.active}"
            )

            if plan.name == "trial":
                return Response(
                    {
                        "success": False,
                        "message": "Trial plan cannot be purchased. It is automatically assigned to new users.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not plan.active:
                return Response(
                    {
                        "success": False,
                        "message": "This subscription plan is not currently available",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing = UserSubscription.objects.filter(
                user=user, is_active=True, end_date__gt=timezone.now()
            ).first()

            if existing and existing.plan.name != "trial":
                return Response(
                    {
                        "success": False,
                        "message": f"You already have an active {existing.plan.name} subscription until {existing.end_date.strftime('%Y-%m-%d')}. Please wait for it to expire or upgrade through the upgrade page.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payment_intent_id = None

            if payment_method == "stripe":
                result = self.handle_stripe_payment(request, plan, user)
                if result is not None:
                    return result
                payment_intent_id = request.data.get("payment_intent_id")
                logger.info(
                    f"Processing Stripe payment with intent ID: {payment_intent_id}"
                )

            elif payment_method == "wallet":
                result = self.handle_wallet_payment(plan, user)
                if result is not None:
                    return result

            else:
                return Response(
                    {"success": False, "message": "Invalid payment method"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            end_date = timezone.now() + timedelta(days=30)

            if existing and existing.plan.name == "trial":

                subscription = existing
                subscription.plan = plan
                subscription.start_date = timezone.now()
                subscription.end_date = end_date
                subscription.is_active = True
                subscription.payment_method = payment_method
                subscription.payment_id = (
                    payment_intent_id if payment_method == "stripe" else None
                )
                subscription.events_joined_current_month = 0
                subscription.events_organized_current_month = 0
                subscription.save()
                logger.info(
                    f"Replaced trial subscription with {plan.name} plan for user {user.id}"
                )
            else:

                subscription, created = UserSubscription.objects.update_or_create(
                    user=user,
                    defaults={
                        "plan": plan,
                        "start_date": timezone.now(),
                        "end_date": end_date,
                        "is_active": True,
                        "payment_method": payment_method,
                        "payment_id": (
                            payment_intent_id if payment_method == "stripe" else None
                        ),
                    },
                )
                logger.info(
                    f"Created/updated subscription for user {user.id}: {subscription.id}, plan: {plan.name}"
                )

            try:
                SubscriptionTransaction.objects.create(
                    subscription=subscription,
                    amount=plan.price,
                    transaction_type="purchase",
                    payment_method=payment_method,
                    transaction_id=(
                        payment_intent_id if payment_method == "stripe" else None
                    ),
                )
                logger.info(
                    f"Created subscription transaction for user {user.id}, plan {plan.name}"
                )
            except Exception as e:
                logger.error(f"Error creating subscription transaction: {str(e)}")
            return Response(
                {
                    "success": True,
                    "subscription_id": subscription.id,
                    "message": "Subscription activated successfully",
                },
                status=status.HTTP_201_CREATED,
            )

        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"success": False, "message": "Plan not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Wallet.DoesNotExist:
            return Response(
                {"success": False, "message": "Wallet not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return Response(
                {"success": False, "message": f"Payment error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error(f"Unhandled subscription error: {str(e)}", exc_info=True)
            return Response(
                {"success": False, "message": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def handle_stripe_payment(self, request, plan, user):
        data = request.data
        try:
            if data.get("create_intent"):
                intent = stripe.PaymentIntent.create(
                    amount=int(plan.price * 100),
                    currency="inr",
                    metadata={
                        "user_id": str(user.id),
                        "plan_id": str(plan.id),
                        "transaction_type": "subscription_purchase",
                    },
                    description=f"Subscription to {plan.name}",
                )
                return Response(
                    {
                        "success": True,
                        "client_secret": intent.client_secret,
                        "intent_id": intent.id,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                intent_id = data.get("payment_intent_id")
                if not intent_id:
                    return Response(
                        {"success": False, "message": "Missing payment intent ID"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                intent = stripe.PaymentIntent.retrieve(intent_id)
                if intent.status != "succeeded":
                    return Response(
                        {
                            "success": False,
                            "message": "Payment not completed",
                            "intent_status": intent.status,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error during intent creation or retrieval: {str(e)}")
            return Response(
                {"success": False, "message": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def handle_wallet_payment(self, plan, user):
        try:
            wallet = Wallet.objects.get(user=user)
            if wallet.balance < plan.price:
                return Response(
                    {"success": False, "message": "Insufficient wallet balance"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            wallet.balance -= plan.price
            wallet.save()

            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type="PAYMENT",
                amount=plan.price,
                description=f"Subscription for {plan.name}",
            )
        except Wallet.DoesNotExist:
            return Response(
                {"success": False, "message": "Wallet not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class UpgradePlan(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            current_subscription = UserSubscription.objects.get(user=user)

            if current_subscription.plan.name.lower() != "basic":
                return Response(
                    {
                        "success": False,
                        "message": "Upgrade not available from your current plan",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                premium_plan = SubscriptionPlan.objects.get(name="premium", active=True)
            except SubscriptionPlan.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "message": "Premium plan is currently unavailable",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            remaining_days = current_subscription.days_remaining()
            if remaining_days == 0:
                return Response(
                    {"success": False, "message": "Your current plan has expired"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            last_transaction = (
                SubscriptionTransaction.objects.filter(
                    subscription=current_subscription,
                    transaction_type__in=["purchase", "renewal"],
                )
                .order_by("-transaction_date")
                .first()
            )

            basic_price = (
                float(last_transaction.amount)
                if last_transaction
                else float(current_subscription.plan.price)
            )

            today = timezone.now().date()
            days_used = (today - current_subscription.start_date.date()).days
            days_used = max(days_used, 0)

            basic_price_per_day = basic_price / 30
            used_amount = basic_price_per_day * days_used
            remaining_balance = max(basic_price - used_amount, 0)

            premium_price = float(premium_plan.price)
            premium_price_per_day = premium_price / 30
            upgrade_cost = round(
                (premium_price_per_day * remaining_days) - remaining_balance, 2
            )
            upgrade_cost = max(upgrade_cost, 0)

            return Response(
                {
                    "success": True,
                    "extra_amount": upgrade_cost,
                    "remaining_days": remaining_days,
                    "premium_price": premium_price,
                    "basic_price_paid": basic_price,
                    "basic_days_used": days_used,
                    "basic_balance": round(remaining_balance, 2),
                }
            )

        except UserSubscription.DoesNotExist:
            return Response(
                {"success": False, "message": "No active subscription found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred while processing your upgrade.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        user = request.user
        payment_method = request.data.get("payment_method")

        try:
            current_subscription = UserSubscription.objects.get(user=user)
            premium_plan = SubscriptionPlan.objects.get(name="premium", active=True)

            remaining_days = current_subscription.days_remaining()
            if remaining_days == 0:
                return Response(
                    {"success": False, "message": "Your current plan has expired"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            last_transaction = (
                SubscriptionTransaction.objects.filter(
                    subscription=current_subscription,
                    transaction_type__in=["purchase", "renewal"],
                )
                .order_by("-transaction_date")
                .first()
            )

            basic_price = (
                float(last_transaction.amount)
                if last_transaction
                else float(current_subscription.plan.price)
            )
            today = timezone.now().date()
            days_used = (today - current_subscription.start_date.date()).days
            days_used = max(days_used, 0)

            basic_price_per_day = basic_price / 30
            used_amount = basic_price_per_day * days_used
            remaining_balance = max(basic_price - used_amount, 0)

            premium_price = float(premium_plan.price)
            premium_price_per_day = premium_price / 30
            upgrade_cost = round(
                (premium_price_per_day * remaining_days) - remaining_balance, 2
            )
            upgrade_cost = max(upgrade_cost, 0)

            if upgrade_cost == 0:
                current_subscription.plan = premium_plan
                current_subscription.save()
                SubscriptionTransaction.objects.create(
                    subscription=current_subscription,
                    amount=0,
                    transaction_type="upgrade",
                    payment_method="none",
                    transaction_id=f"zero_cost_upgrade_{uuid.uuid4()}",
                )
                return Response(
                    {
                        "success": True,
                        "message": "Subscription upgraded successfully at no additional cost",
                        "transaction_id": "zero_cost",
                    },
                    status=status.HTTP_200_OK,
                )

            if payment_method == "wallet":
                return self.process_wallet_payment(
                    user,
                    current_subscription,
                    premium_plan,
                    upgrade_cost,
                    remaining_days,
                )
            elif payment_method == "stripe":
                if request.data.get("create_intent"):
                    return self.create_stripe_payment_intent(user, upgrade_cost)
                elif request.data.get("payment_intent_id"):
                    return self.process_stripe_payment(
                        user,
                        current_subscription,
                        premium_plan,
                        upgrade_cost,
                        remaining_days,
                        request.data.get("payment_intent_id"),
                    )
                else:
                    return Response(
                        {"success": False, "message": "Invalid stripe payment request"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"success": False, "message": "Invalid payment method"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except UserSubscription.DoesNotExist:
            return Response(
                {"success": False, "message": "No active subscription found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"success": False, "message": "Premium plan is currently unavailable"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred while processing your upgrade.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def process_wallet_payment(
        self, user, current_subscription, premium_plan, amount, remaining_days
    ):
        try:
            wallet = Wallet.objects.get(user=user)

            if wallet.balance < Decimal(str(amount)):
                return Response(
                    {"success": False, "message": "Insufficient wallet balance"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            wallet.balance -= Decimal(str(amount))
            wallet.save()

            wallet_transaction = WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type="PAYMENT",
                amount=amount,
                description=f"Subscription upgrade from Basic to Premium",
            )

            old_end_date = current_subscription.end_date
            current_subscription.plan = premium_plan
            current_subscription.save()

            subscription_transaction = SubscriptionTransaction.objects.create(
                subscription=current_subscription,
                amount=amount,
                transaction_type="upgrade",
                payment_method="wallet",
                transaction_id=str(wallet_transaction.transaction_id),
            )

            return Response(
                {
                    "success": True,
                    "message": "Subscription upgraded successfully",
                    "transaction_id": str(wallet_transaction.transaction_id),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while processing wallet payment",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def create_stripe_payment_intent(self, user, amount):
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),
                currency="inr",
                metadata={
                    "user_id": str(user.id),
                    "transaction_type": "subscription_upgrade",
                },
                description=f"Subscription upgrade to Premium for {user.username}",
            )
            logger.info(
                f"[Stripe Intent Created]: User {user.id}, Intent {intent.id}, Amount {amount}"
            )
            return Response(
                {"success": True, "client_secret": intent.client_secret},
                status=status.HTTP_200_OK,
            )
        except stripe.error.StripeError as e:
            logger.error(f"[Stripe Error]: User {user.id}, Error: {str(e)}")
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error(f"[Stripe Intent Error]: User {user.id}, Error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while creating payment intent",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def process_stripe_payment(
        self,
        user,
        current_subscription,
        premium_plan,
        amount,
        remaining_days,
        payment_intent_id,
    ):
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            if intent.status != "succeeded":
                return Response(
                    {"success": False, "message": "Payment has not been completed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            old_end_date = current_subscription.end_date
            current_subscription.plan = premium_plan
            current_subscription.payment_method = "stripe"
            current_subscription.payment_id = payment_intent_id
            current_subscription.save()

            subscription_transaction = SubscriptionTransaction.objects.create(
                subscription=current_subscription,
                amount=amount,
                transaction_type="upgrade",
                payment_method="stripe",
                transaction_id=payment_intent_id,
            )

            return Response(
                {
                    "success": True,
                    "message": "Subscription upgraded successfully",
                    "transaction_id": payment_intent_id,
                },
                status=status.HTTP_200_OK,
            )

        except stripe.error.StripeError as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while processing payment",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserPlanDetails(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            subscription = UserSubscription.objects.select_related("plan").get(
                user=user
            )
            serializer = UserPlanDetailsSerializer(subscription)
            return Response({"success": True, "subscription": serializer.data})
        except UserSubscription.DoesNotExist:
            return Response(
                {"success": False, "error": "No active subscripton found."},
                status=status.HTTP_404_NOT_FOUND,
            )


class RenewSubscription(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            cu_subscription = UserSubscription.objects.select_related("plan").get(
                user=user
            )
            if not cu_subscription.plan.active:
                return Response(
                    {"success": False, "error": "Plan currently unavailable"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            current_plan = {
                "id": cu_subscription.plan.id,
                "name": cu_subscription.plan.name,
                "end_date": cu_subscription.end_date.strftime("%Y-%m-%d"),
                "expired": cu_subscription.is_expired(),
            }

            plan_data = SubscriptionPlanSerializer(cu_subscription.plan)

            try:
                wallet_balance = user.wallet.balance
            except Wallet.DoesNotExist:
                wallet_balance = 0

            return Response(
                {
                    "success": True,
                    "plan": plan_data.data,
                    "current_plan": current_plan,
                    "wallet_balance": float(wallet_balance),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"success": False, "error": f"{e}"}, status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        try:
            plan_id = request.data.get("plan_id")
            payment_method = request.data.get("payment_method")
            create_intent = request.data.get("create_intent", False)
            payment_intent_id = request.data.get("payment_intent_id")

            user = request.user

            try:
                plan = SubscriptionPlan.objects.get(id=plan_id, active=True)
            except SubscriptionPlan.DoesNotExist:
                return Response(
                    {"success": False, "error": "Plan currently unavailable"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if payment_method == "stripe" and create_intent:
                try:
                    intent = stripe.PaymentIntent.create(
                        amount=int(plan.price * 100),
                        currency="inr",
                        metadata={
                            "user_id": user.id,
                            "plan_id": plan.id,
                            "plan_name": plan.name,
                        },
                    )
                    return Response(
                        {"success": True, "client_secret": intent.client_secret},
                        status=status.HTTP_200_OK,
                    )
                except Exception as e:
                    return Response(
                        {
                            "success": False,
                            "message": f"Error creating payment intent: {str(e)}",
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

            if payment_method == "wallet":
                try:
                    wallet = Wallet.objects.get(user=user)

                    if wallet.balance < Decimal(plan.price):
                        return Response(
                            {
                                "success": False,
                                "message": "Insufficient wallet balance",
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    transaction_id = str(uuid.uuid4())

                    wallet.balance -= Decimal(plan.price)
                    wallet.save()
                    WalletTransaction.objects.create(
                        wallet=wallet,
                        transaction_type="PAYMENT",
                        amount=plan.price,
                        description=f"Payment for {plan.name} subscription",
                        transaction_id=uuid.UUID(transaction_id),
                    )

                    return self.process_subscription(
                        user, plan, payment_method, transaction_id
                    )
                except Wallet.DoesNotExist:
                    return Response(
                        {"success": False, "message": "Wallet not found"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            elif payment_method == "stripe" and payment_intent_id:
                try:
                    payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

                    if payment_intent.status != "succeeded":
                        return Response(
                            {
                                "success": False,
                                "message": "Payment has not been completed successfully",
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    return self.process_subscription(
                        user, plan, payment_method, payment_intent_id
                    )

                except Exception as e:
                    return Response(
                        {
                            "success": False,
                            "message": f"Error processing payment: {str(e)}",
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

            else:
                return Response(
                    {"success": False, "message": "Invalid request parameters"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            return Response(
                {"success": False, "message": "payment failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def process_subscription(self, user, plan, payment_method, payment_id):
        start_date = timezone.now()
        end_date = start_date + timedelta(days=30)

        cur_subscription = UserSubscription.objects.get(user=user, is_active=True)

        cur_subscription.plan = plan
        cur_subscription.start_date = start_date
        cur_subscription.end_date = end_date
        cur_subscription.payment_method = payment_method
        cur_subscription.payment_id = payment_id
        cur_subscription.save()

        subscription = cur_subscription
        transaction_type = "renewal"

        SubscriptionTransaction.objects.create(
            subscription=subscription,
            amount=plan.price,
            transaction_type=transaction_type,
            payment_method=payment_method,
            transaction_id=payment_id,
        )

        return Response(
            {
                "success": True,
                "message": "Subscription activated successfully",
                "subscription": {
                    "plan_name": plan.get_name_display(),
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d"),
                },
            },
            status=status.HTTP_200_OK,
        )


class RenewSubscription(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get renewal information for current subscription"""
        user = request.user
        try:
            current_subscription = UserSubscription.objects.get(
                user=user, is_active=True
            )

            if not current_subscription.is_expired():
                return Response(
                    {
                        "success": False,
                        "message": "Your subscription is still active. No renewal needed.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    "success": True,
                    "subscription": UserPlanDetailsSerializer(
                        current_subscription
                    ).data,
                    "renewal_price": float(current_subscription.plan.price),
                }
            )

        except UserSubscription.DoesNotExist:
            return Response(
                {"success": False, "message": "No subscription found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def post(self, request):
        """Renew expired subscription"""
        user = request.user
        payment_method = request.data.get("payment_method")

        try:
            current_subscription = UserSubscription.objects.get(
                user=user, is_active=True
            )

            if not current_subscription.is_expired():
                return Response(
                    {
                        "success": False,
                        "message": "Your subscription is still active. No renewal needed.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if payment_method == "stripe":
                result = self.handle_stripe_renewal(request, current_subscription, user)
                if result is not None:
                    return result
            elif payment_method == "wallet":
                result = self.handle_wallet_renewal(current_subscription, user)
                if result is not None:
                    return result
            else:
                return Response(
                    {"success": False, "message": "Invalid payment method"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Extend subscription by 30 days
            current_subscription.end_date = timezone.now() + timedelta(days=30)
            current_subscription.is_active = True
            current_subscription.payment_method = payment_method
            current_subscription.save()

            # Create renewal transaction
            SubscriptionTransaction.objects.create(
                subscription=current_subscription,
                amount=current_subscription.plan.price,
                transaction_type="renewal",
                payment_method=payment_method,
                transaction_id=(
                    request.data.get("payment_intent_id")
                    if payment_method == "stripe"
                    else None
                ),
            )

            return Response(
                {
                    "success": True,
                    "message": "Subscription renewed successfully",
                    "subscription": UserPlanDetailsSerializer(
                        current_subscription
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        except UserSubscription.DoesNotExist:
            return Response(
                {"success": False, "message": "No subscription found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Renewal error: {str(e)}")
            return Response(
                {"success": False, "message": "An error occurred during renewal"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def handle_stripe_renewal(self, request, subscription, user):
        """Handle Stripe payment for renewal"""
        data = request.data
        try:
            if data.get("create_intent"):
                intent = stripe.PaymentIntent.create(
                    amount=int(subscription.plan.price * 100),
                    currency="inr",
                    metadata={
                        "user_id": str(user.id),
                        "subscription_id": str(subscription.id),
                        "transaction_type": "subscription_renewal",
                    },
                    description=f"Renewal for {subscription.plan.name} subscription",
                )
                return Response(
                    {
                        "success": True,
                        "client_secret": intent.client_secret,
                        "intent_id": intent.id,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                intent_id = data.get("payment_intent_id")
                if not intent_id:
                    return Response(
                        {"success": False, "message": "Missing payment intent ID"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                intent = stripe.PaymentIntent.retrieve(intent_id)
                if intent.status != "succeeded":
                    return Response(
                        {
                            "success": False,
                            "message": "Payment not completed",
                            "intent_status": intent.status,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        except stripe.error.StripeError as e:
            logger.error(f"Stripe renewal error: {str(e)}")
            return Response(
                {"success": False, "message": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def handle_wallet_renewal(self, subscription, user):
        """Handle wallet payment for renewal"""
        try:
            wallet = Wallet.objects.get(user=user)
            if wallet.balance < subscription.plan.price:
                return Response(
                    {"success": False, "message": "Insufficient wallet balance"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            wallet.balance -= subscription.plan.price
            wallet.save()

            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type="PAYMENT",
                amount=subscription.plan.price,
                description=f"Subscription renewal for {subscription.plan.name}",
            )
        except Wallet.DoesNotExist:
            return Response(
                {"success": False, "message": "Wallet not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class UserPlanDetails(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's subscription details"""
        user = request.user
        try:
            subscription = UserSubscription.objects.get(user=user, is_active=True)
            serializer = UserPlanDetailsSerializer(subscription)

            return Response(
                {
                    "success": True,
                    "subscription": serializer.data,
                }
            )
        except UserSubscription.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "No active subscription found",
                    "subscription": None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error fetching subscription details: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while fetching subscription details",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SubscriptionTransactions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's subscription transaction history"""
        user = request.user
        try:
            subscription = UserSubscription.objects.get(user=user, is_active=True)
            transactions = SubscriptionTransaction.objects.filter(
                subscription=subscription
            ).order_by("-transaction_date")

            serializer = SubscriptionTransactionSerializer(transactions, many=True)

            return Response(
                {
                    "success": True,
                    "transactions": serializer.data,
                }
            )
        except UserSubscription.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "No active subscription found",
                    "transactions": [],
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error fetching subscription transactions: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while fetching transaction history",
                    "transactions": [],
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
