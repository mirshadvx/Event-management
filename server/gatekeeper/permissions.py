from rest_framework import permissions

class IsEventOrganizer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user:
            return False
        if not request.user.organizerVerified:
            return False

        if "event_id" in view.kwargs:
            from event.models import Event
            try:
                event = Event.objects.get(id=view.kwargs["event_id"])
                return event.organizer == request.user
            except Event.DoesNotExist:
                return False
        return True
    
    def has_object_permission(self, request, view, obj):
        return obj.event.organizer == request.user