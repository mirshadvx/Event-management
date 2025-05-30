from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import Profile
from .serializers import UserProfileSerializer
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import *
from Admin.models import UserSubscription
from django.utils import timezone

class UserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not isinstance(user, Profile):
            return Response({"error": "Invalid user"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            username = request.data.get("username")
            follow_action = request.data.get("follow")

            if username is None or follow_action is None:
                return Response({"error": "Username and follow status are required."},
                    status=status.HTTP_400_BAD_REQUEST )

            followed_user = get_object_or_404(Profile, username=username)

            if followed_user == request.user:
                return Response(
                    {"error": "You cannot follow yourself."},
                    status=status.HTTP_400_BAD_REQUEST)

            follow_qs = Follow.objects.filter(follower=request.user, followed=followed_user)
            follow_exists = follow_qs.exists()

            subscription = UserSubscription.objects.filter(
                user=request.user,
                is_active=True,
                end_date__gt=timezone.now()).first()
            
            has_premium = subscription is not None and subscription.plan.name == 'premium'

            if follow_action is True:
                if follow_exists:
                    return Response( {"error": "Already following this user."}, status=status.HTTP_400_BAD_REQUEST)

                follow_status = "accepted" if has_premium else "pending"

                Follow.objects.create(
                    follower=request.user,
                    followed=followed_user,
                    status=follow_status )

                message = "Follow request sented." if follow_status == "pending" else "Followed successfully."

                return Response({"message": message, "status": follow_status},
                    status=status.HTTP_201_CREATED)

            elif follow_action is False:
                if not follow_exists:
                    return Response( {"error": "You are not following this user."}, status=status.HTTP_400_BAD_REQUEST )

                follow_qs.delete()

                return Response(
                    {"message": "Unfollowed successfully."}, status=status.HTTP_200_OK)

            else:
                return Response(
                    {"error": "Invalid follow status. Use true for follow, false for unfollow."},
                    status=status.HTTP_400_BAD_REQUEST )

        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR )