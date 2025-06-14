from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import Profile
from .serializers import UserProfileSerializer, ReviewSerializer, FollowRequestSerializer
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import *
from Admin.models import UserSubscription
from django.utils import timezone
from event.models import Event, Review
from users.tasks import send_user_notification
from chat.models import Conversation

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
                                status=status.HTTP_400_BAD_REQUEST)

            followed_user = get_object_or_404(Profile, username=username)

            if followed_user == request.user:
                return Response({"error": "You cannot follow yourself."},
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
                    return Response({"error": "Already following this user."},
                                    status=status.HTTP_400_BAD_REQUEST)

                follow_status = "accepted" if has_premium else "pending"
                follow = Follow.objects.create(
                    follower=request.user,
                    followed=followed_user,
                    status=follow_status
                )

                message = "Followed successfully." if follow_status == "accepted" else "Follow request sent."
                if follow_status == "pending":
                    send_user_notification.delay(
                        followed_user.id,
                        f"{request.user.username} send a following request",
                    )

                return Response({"message": message, "status": follow_status},
                                status=status.HTTP_201_CREATED)

            elif follow_action is False:
                if not follow_exists:
                    return Response({"error": "You are not following this user."},
                                    status=status.HTTP_400_BAD_REQUEST)
                follow_qs.delete()
                return Response({"message": "Unfollowed successfully."},
                                status=status.HTTP_200_OK)

            else:
                return Response({"error": "Invalid follow status. Use true for follow, false for unfollow."},
                                status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": "An unexpected error occurred"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FollowRequestList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        follow_requests = Follow.objects.filter(followed=request.user, status='pending')
        serializer = FollowRequestSerializer(follow_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        Follow.objects.filter(followed=request.user, status='pending').delete()
        return Response({'message': 'All follow requests cleared.'}, status=status.HTTP_200_OK)

class FollowRequestDetail(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        action = request.data.get('action')
        try:
            follow_request = Follow.objects.get(pk=pk, followed=request.user, status='pending')
            if action == 'accept':
                return self.accept_follow_request(request, follow_request)
            elif action == 'reject':
                return self.reject_follow_request(follow_request)
            else:
                return Response({'error': 'Invalid action. Use "accept" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)
        except Follow.DoesNotExist:
            return Response({'error': 'Follow request not found.'}, status=status.HTTP_404_NOT_FOUND)

    def accept_follow_request(self, request, follow_request):
        follow_request.status = 'accepted'
        follow_request.save()

        follower_profile = follow_request.follower
        followed_profile = follow_request.followed
        existing_convo = Conversation.objects.filter(
            participants=follower_profile
        ).filter(participants=followed_profile).distinct()

        if not existing_convo.exists():
            convo = Conversation.objects.create()
            convo.participants.set([follower_profile, followed_profile])
            convo.save()
        message = f"{followed_profile.username} accepted your follow request."
        send_user_notification.delay(follower_profile.id, message)

        return Response({'message': message}, status=status.HTTP_200_OK)

    def reject_follow_request(self, follow_request):
        follow_request.status = 'rejected'
        follow_request.save()
        follower_profile = follow_request.follower
        followed_profile = follow_request.followed
        message = f"{followed_profile.username} rejected your follow request."
        send_user_notification.delay(follower_profile.id, message)
        return Response({'message': message}, status=status.HTTP_200_OK)
            
class ReviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        try:
            review = Review.objects.get(event_id=event_id, user=request.user)
            serializer = ReviewSerializer(review)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Review.DoesNotExist:
            return Response({"error": "No review found for this event"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
            if Review.objects.filter(event=event, user=request.user).exists():
                return Response(
                    {"error": "You have already reviewed this event"},
                    status=status.HTTP_400_BAD_REQUEST )

            data = request.data.copy()
            data['event'] = event_id
            data['user'] = request.user.id

            serializer = ReviewSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Event.DoesNotExist:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, event_id):
        try:
            review = Review.objects.get(event_id=event_id, user=request.user)
            serializer = ReviewSerializer(review, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Review.DoesNotExist:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, event_id):
        try:
            review = Review.objects.get(event_id=event_id, user=request.user)
            review.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)  # Remove error message
        except Review.DoesNotExist:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)