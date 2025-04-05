from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Event, Like, Comment
from .serializers import EventSerializer
from django.db.models import Count
from .serializers import EventPreviewSerializer, EventSerializerExplore
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes


class EventCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            serializer = EventSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                event = serializer.save()
                return Response({'success': True, 'message': 'Event created successfully',
                    'data': EventSerializer(event).data
                }, status=status.HTTP_201_CREATED)
            else:
                print("Validation errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Exception in EventCreateView: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class EventPreviewPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'limit'
    max_page_size = 100

    
class EventPreviewList(APIView):
    pagination_class = EventPreviewPagination

    def get(self, request, *args, **kwargs):
        queryset = Event.objects.filter(is_published=True).annotate(
            like_count=Count('likes', distinct=True),
            comment_count=Count('comments', distinct=True)
        ).order_by('-created_at')
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = EventPreviewSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = EventPreviewSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
class EventDetailViewExplore(APIView):
    def get(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
            serializer = EventSerializerExplore(event, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Event.DoesNotExist:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
   
    
@api_view(['POST'])
def like_or_comment(request, event_id):
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    action = request.data.get("action")
    
    if action == "like":
        like, liked = Like.objects.get_or_create(user=user, event=event)
        if not liked:
            like.delete()
            return Response({
                "message": "Event unliked",
                "like_count": event.like_count()
            }, status=status.HTTP_200_OK)
        return Response({
            "message": "Event liked",
            "like_count": event.like_count()
        }, status=status.HTTP_201_CREATED)    


    elif action == "comment":
        text = request.data.get("text")
        if not text:
            return Response({"error": "Comment text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        comment = Comment.objects.create(user=user, event=event, text=text)
        response_data = {
            'message': 'Comment added',
            'id': comment.id,
            'username': user.username,
            'profile_picture':user.profile_picture,
            'text': comment.text,
            'created_at': comment.created_at.isoformat()
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

    else:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
