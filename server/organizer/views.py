from rest_framework.views import APIView
from .paginations import *
from rest_framework.permissions import IsAuthenticated
from event.models import *
import django_filters
from .filters import *
from .serializers import *
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from users.models import Profile

class OrganizedList(APIView):
    pagination_class = OrganizedListPagination
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            user = request.user
            queryset = Event.objects.filter(organizer=user)

            filtered_queryset = OrganizerEventsFilter(request.query_params, queryset=queryset).qs

            paginator = self.pagination_class()
            page = paginator.paginate_queryset(filtered_queryset, request)
            serialized_data = EventOrganizerList(page, many=True)

            return paginator.get_paginated_response(serialized_data.data)
        except Exception as e:
            print(e)
            return Response({"error": "datas not found"}, status=status.HTTP_400_BAD_REQUEST)
        
class UserProfileDetails(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            username = request.query_params.get('username')
            if not username:
                return Response({"error": "Username is required."}, status=status.HTTP_404_NOT_FOUND)
            
            user = get_object_or_404(Profile, username=username)
            serializer = UserProfileSerializer(user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response({"error":"Failed to load the data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            username = request.data.get("username")
            follow_action = request.data.get("follow")

            if username is None or follow_action is None:
                return Response( {"error": "Username and follow status are required."},
                                status=status.HTTP_400_BAD_REQUEST )

            followed_user = get_object_or_404(Profile, username=username)

            if followed_user == request.user:
                return Response( {"error": "You cannot follow yourself."},
                                status=status.HTTP_400_BAD_REQUEST )

            follow_exists = Follow.objects.filter(follower=request.user, followed=followed_user).exists()

            if follow_action is True:
                if follow_exists:
                    return Response( {"error": "Already following this user."},
                                    status=status.HTTP_400_BAD_REQUEST)
                follow = Follow.objects.create(follower=request.user, followed=followed_user)
                return Response( {"message": "Following successfully!"},
                                status=status.HTTP_201_CREATED )

            elif follow_action is False:
                if not follow_exists:
                    return Response( {"error": "You are not following this user."}, 
                                    status=status.HTTP_400_BAD_REQUEST )
                Follow.objects.filter(follower=request.user, followed=followed_user).delete()
                return Response( {"message": "Unfollowed successfully."},
                                status=status.HTTP_200_OK )

            else:
                return Response( {"error": "Invalid follow status. Use true for follow, false for unfollow."},
                                status=status.HTTP_400_BAD_REQUEST )

        except Exception as e:
            return Response( {"error": "An unexpected error occurred"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR )