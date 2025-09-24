from users.models import Booking
from Admin.models import Badge, UserBadge
from event.models import Ticket, Event
import datetime


def check_and_assign_badges(profile):
    role = "Organizer" if profile.organizerVerified else "User"
    badges = Badge.objects.filter(applicable_role=role)

    for badge in badges:
        if UserBadge.objects.filter(user=profile, badge=badge).exists():
            continue

        if badge.criteria_type == "event_attended":
            attended_count = Booking.objects.filter(user=profile).distinct().count()
            if attended_count >= badge.target_count:
                assign_badge(profile, badge)

        elif badge.criteria_type == "event_created":
            created_count = Event.objects.filter(organizer=profile).count()
            if created_count >= badge.target_count:
                assign_badge(profile, badge)

        elif badge.criteria_type == "feedback_given":
            feedback_count = 0
            if feedback_count >= badge.target_count:
                assign_badge(profile, badge)


def assign_badge(profile, badge):
    user_badge, created = UserBadge.objects.get_or_create(
        user=profile, badge=badge, defaults={"date_earned": datetime.datetime.now()}
    )
    if created:
        print("badge created")
