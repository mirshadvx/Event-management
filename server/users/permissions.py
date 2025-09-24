from rest_framework import permissions


class IsActiveUser(permissions.BasePermission):
    """
    Custom permission to only allow active users to access the API.
    """

    message = "Your account is inactive. Please contact support for assistance."

    def has_permission(self, request, view):
        return request.user and request.user.is_active
