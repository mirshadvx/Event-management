from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from .models import ManagedUser


class GuardAuth(BaseBackend):
    def authenticate(self, request=None, event_id=None, username=None, password=None, **kwargs):
        try:
            user = ManagedUser.objects.get(
                event_id=event_id,
                username__iexact=username,
                active=True,
            )
        except ManagedUser.DoesNotExist:
            return None

        if check_password(password, user.password):
            return user

        return None

    def get_user(self, user_id):
        try:
            return ManagedUser.objects.get(pk=user_id, active=True)
        except ManagedUser.DoesNotExist:
            return None