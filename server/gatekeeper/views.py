from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .permissions import IsEventOrganizer
from django.shortcuts import get_object_or_404
from event.models import Event
from .models import ManagedUser
from .serializers import *
from rest_framework.response import Response


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