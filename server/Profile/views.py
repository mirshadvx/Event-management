from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import Profile
from .serializers import UserProfileSerializer
from rest_framework.permissions import IsAuthenticated


class UserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not isinstance(user, Profile):
            return Response({"error": "Invalid user"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)