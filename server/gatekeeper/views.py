from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .permissions import IsEventOrganizer
from django.shortcuts import get_object_or_404
from event.models import Event, TicketPurchase
from .models import ManagedUser, TicketScanLog
from .serializers import (
    IsGuardAuthenticated,
    ManagedUserCreateSerailizer,
    ManagedUserSerializer,
    ManageUserToggleSerializer,
    TicketScanLogSerializer,
)
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .backends import GuardAuth
from datetime import datetime, timedelta
import jwt
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone


def guard_staff_payload(user):
    event = user.event
    return {
        "id": user.id,
        "username": user.username,
        "event": {
            "id": event.id,
            "name": event.event_title,
            "organizer": event.organizer.username,
            "date": event.start_date,
            "time": event.start_time,
            "venue": event.venue_name,
            "gate": event.address,
            "ticketsSold": event.total_tickets_sold(),
        },
    }


def ticket_validation_payload(purchase, validation_status, message):
    return {
        "status": validation_status,
        "message": message,
        "ticket_id": purchase.id,
        "holder": purchase.buyer.username,
        "tier": purchase.ticket.ticket_type,
        "booking_id": purchase.booking_id,
        "used_tickets": purchase.used_tickets,
        "quantity": purchase.quantity,
        "remaining_tickets": max(purchase.quantity - purchase.used_tickets, 0),
    }


def ticket_scan_stats(event_id):
    stats = TicketScanLog.objects.filter(event_id=event_id).aggregate(
        total=Count("id"),
        granted=Count("id", filter=Q(status="valid")),
        denied=Count("id", filter=~Q(status="valid")),
    )
    return {
        "granted": stats["granted"] or 0,
        "denied": stats["denied"] or 0,
        "total": stats["total"] or 0,
    }


def create_ticket_scan_log(event_id, guard, scanned_code, payload, purchase=None):
    return TicketScanLog.objects.create(
        event_id=event_id,
        guard=guard,
        ticket_purchase=purchase,
        scanned_code=scanned_code,
        status=payload["status"],
        message=payload["message"],
        holder=payload.get("holder", ""),
        tier=payload.get("tier", ""),
        booking_id=payload.get("booking_id"),
        used_tickets=payload.get("used_tickets"),
        quantity=payload.get("quantity"),
        remaining_tickets=payload.get("remaining_tickets"),
    )


class ManagedUserCreateView(APIView):
    permission_classes = [IsAuthenticated, IsEventOrganizer]

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        managed_users = ManagedUser.objects.filter(event=event)
        serializer = ManagedUserSerializer(managed_users, many=True)
        return Response(serializer.data)

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)

        serializer = ManagedUserCreateSerailizer(data=request.data)
        if serializer.is_valid():
            serializer.save(event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagedUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsEventOrganizer]

    def get_object(self, event_id, user_id):
        event = get_object_or_404(Event, id=event_id)
        return get_object_or_404(ManagedUser, id=user_id, event=event)

    def patch(self, request, event_id, user_id):
        managed_user = self.get_object(event_id, user_id)
        serializer = ManageUserToggleSerializer(
            managed_user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, event_id, user_id):
        managed_user = self.get_object(event_id, user_id)
        managed_user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@method_decorator(csrf_exempt, name="dispatch")
class GuardLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, event_id):
        username = request.data.get("username")
        password = request.data.get("password")
        user = GuardAuth().authenticate(
                    request=request,
                    event_id=event_id,
                    username=username,
                    password=password,
                )
        
        if user:
            payload = {
                "user_id":user.id,
                "event_id":user.event.id,
                "exp": datetime.utcnow() + timedelta(hours=24),
            }
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

            response = Response(
                {"message": "Login successful", "staff": guard_staff_payload(user)},
                status=status.HTTP_200_OK,
            )
            response.set_cookie(
                key="guard_token",
                value=token,
                httponly=True,
                secure=settings.DEBUG is False,
                samesite="Lax",
                max_age=86400, 
            )
            return response
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
@method_decorator(csrf_exempt, name="dispatch")
class GuardLogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        response = Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        response.delete_cookie("guard_token")
        return response


class GuardSessionView(APIView):
    permission_classes = [IsGuardAuthenticated]
    authentication_classes = []

    def get(self, request, event_id):
        if request.guard_user.event_id != event_id:
            return Response(
                {"error": "Guard is not assigned to this event."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response({"staff": guard_staff_payload(request.guard_user)})


@method_decorator(csrf_exempt, name="dispatch")
class GuardTicketVerifyView(APIView):
    permission_classes = [IsGuardAuthenticated]
    authentication_classes = []

    def post(self, request, event_id):
        if request.guard_user.event_id != event_id:
            return Response(
                {"error": "Guard is not assigned to this event."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ticket_id = request.data.get("ticket_id")
        if not ticket_id:
            return Response(
                {"status": "invalid", "message": "Ticket code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                purchase = (
                    TicketPurchase.objects.select_for_update()
                    .select_related("buyer", "ticket")
                    .get(unique_qr_code=ticket_id, event_id=event_id)
                )

                if purchase.used_tickets >= purchase.quantity:
                    payload = ticket_validation_payload(
                        purchase,
                        "used",
                        "All tickets in this purchase are already used.",
                    )
                    scan_log = create_ticket_scan_log(
                        event_id,
                        request.guard_user,
                        ticket_id,
                        payload,
                        purchase,
                    )
                    payload["scan_log_id"] = scan_log.id
                    payload["scanned_at"] = scan_log.scanned_at
                    return Response(
                        {**payload, "stats": ticket_scan_stats(event_id)},
                        status=status.HTTP_200_OK,
                    )

                purchase.used_tickets += 1
                purchase.save(update_fields=["used_tickets"])
                payload = ticket_validation_payload(
                    purchase,
                    "valid",
                    "Ticket validated successfully.",
                )
                scan_log = create_ticket_scan_log(
                    event_id,
                    request.guard_user,
                    ticket_id,
                    payload,
                    purchase,
                )

            payload["scan_log_id"] = scan_log.id
            payload["scanned_at"] = scan_log.scanned_at
            return Response(
                {**payload, "stats": ticket_scan_stats(event_id)},
                status=status.HTTP_200_OK,
            )
        except TicketPurchase.DoesNotExist:
            payload = {
                "status": "invalid",
                "message": "Ticket is not valid for this event.",
            }
            scan_log = create_ticket_scan_log(
                event_id,
                request.guard_user,
                ticket_id,
                payload,
            )
            return Response(
                {
                    **payload,
                    "scan_log_id": scan_log.id,
                    "scanned_at": scan_log.scanned_at,
                    "stats": ticket_scan_stats(event_id),
                },
                status=status.HTTP_200_OK,
            )


class GuardTicketScanHistoryView(APIView):
    permission_classes = [IsGuardAuthenticated]
    authentication_classes = []

    def get(self, request, event_id):
        if request.guard_user.event_id != event_id:
            return Response(
                {"error": "Guard is not assigned to this event."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            limit = min(max(int(request.query_params.get("limit", 50)), 1), 100)
        except ValueError:
            limit = 50

        logs = TicketScanLog.objects.filter(event_id=event_id).select_related(
            "guard", "ticket_purchase"
        )[:limit]
        serializer = TicketScanLogSerializer(logs, many=True)

        return Response(
            {
                "stats": ticket_scan_stats(event_id),
                "logs": serializer.data,
                "server_time": timezone.now(),
            },
            status=status.HTTP_200_OK,
        )
