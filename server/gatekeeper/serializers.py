import re
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.core.validators import RegexValidator
from .models import ManagedUser, TicketScanLog
from rest_framework.exceptions import PermissionDenied
import jwt
from django.conf import settings
from rest_framework import permissions

USERNAME_REGEX = r"^[a-zA-Z][a-zA-Z0-9_.]{2,19}$"
USERNAME_VALIDATOR = RegexValidator(
    regex=USERNAME_REGEX,
    message=(
        "Username must start with a letter and contain only letters, "
        "numbers, dots or underscores (3-20 characters)."
    ),
)

PASSWORD_REGEX = r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*_\-.]{6,64}$"


class ManagedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagedUser
        fields = ["id", "username", "permission_given_date", "active", "created_at"]
        read_only_fields = ["id", "permission_given_date", "created_at"]


class ManagedUserCreateSerailizer(serializers.ModelSerializer):
    username = serializers.CharField(
        min_length=3,
        max_length=20,
        validators=[USERNAME_VALIDATOR],
    )
    password = serializers.CharField(
        min_length=6,
        max_length=64,
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = ManagedUser
        fields = ["username", "password"]

    def validate_username(self, value):
        value = value.strip()

        if re.search(r"\s", value):
            raise serializers.ValidationError("Username cannot contain spaces.")

        if ManagedUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")

        return value

    def validate_password(self, value):
        if re.search(r"\s", value):
            raise serializers.ValidationError("Password cannot contain spaces.")

        if not re.match(PASSWORD_REGEX, value):
            raise serializers.ValidationError(
                "Password must be 6-64 characters and include at least one "
                "letter and one number."
            )

        return value

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)


class ManageUserToggleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagedUser
        fields = ["active"]


class TicketScanLogSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source="scanned_code", read_only=True)
    usedTickets = serializers.IntegerField(source="used_tickets", read_only=True)
    remainingTickets = serializers.IntegerField(
        source="remaining_tickets", read_only=True
    )
    bookingId = serializers.CharField(source="booking_id", read_only=True)
    time = serializers.DateTimeField(source="scanned_at", read_only=True)

    class Meta:
        model = TicketScanLog
        fields = [
            "id",
            "status",
            "code",
            "holder",
            "tier",
            "message",
            "usedTickets",
            "quantity",
            "remainingTickets",
            "bookingId",
            "time",
        ]


class IsGuardAuthenticated(permissions.BasePermission):

    def has_permission(self, request, view):
        guard_token = request.COOKIES.get("guard_token")
        if not guard_token:
            return False

        try:
            payload = jwt.decode(guard_token, settings.SECRET_KEY, algorithms=["HS256"])
            user = ManagedUser.objects.get(id=payload["user_id"], active=True)
            request.guard_user = user
            return True
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ManagedUser.DoesNotExist):
            raise PermissionDenied("Invalid or expired guard token.")
