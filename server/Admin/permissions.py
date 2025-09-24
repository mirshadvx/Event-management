from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.is_staff)
        )

    def has_object_permission(self, request, view, obj):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.is_staff)
        )
