from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Event, Like, Comment, LiveStream
from .serializers import EventSerializer, LiveStreamSerializer, EventCompleteDataSerializer
from django.db.models import Count
from .serializers import EventPreviewSerializer, EventSerializerExplore
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from chat.models import GroupConversation
from django.utils import timezone
import logging
logger = logging.getLogger(__name__)

class EventCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return self.handle_event(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        print(request.data)
        return self.handle_event(request, *args, **kwargs)
    
    def handle_event(self, request, *args, **kwargs):
        event_id = request.data.get('event_id')
        try:
            if event_id:
                event = Event.objects.get(id=event_id, organizer=request.user)
                serializer = EventSerializer(event, data=request.data, context={'request': request})
            else:
                serializer = EventSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():             
                validated_data = serializer.validated_data
                if validated_data.get('is_published', False):
                    validated_data['published_at'] = timezone.now().date()
                else:
                    validated_data['published_at'] = timezone.now().date()

                event = serializer.save()

                if not event_id:
                    group_chat = GroupConversation.objects.create(
                        name=f"{event.event_title} chat",
                        admin=request.user,
                        event=event
                    )
                    group_chat.participants.add(request.user)

                return Response({
                    'success': True,
                    'message': 'Event created successfully' if not event_id else 'Event updated successfully',
                    'data': EventSerializer(event).data
                }, status=status.HTTP_201_CREATED if not event_id else status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Event.DoesNotExist:
            return Response({"error": "Event does not exist"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EventPreviewPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'limit'
    max_page_size = 100

class EventPreviewList(APIView):
    pagination_class = EventPreviewPagination
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]
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

class LiveStreamCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.info(f"Received data: {request.data}")
            event_id = request.data.get('event_id')
            room_id = request.data.get('room_id')
            stream_status = request.data.get('stream_status', 'live')
            
            event = get_object_or_404(Event, id=event_id)

            if event.organizer != request.user:
                return Response(
                    {"error": "You do not have permission to create a stream for this event"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            existing_stream = LiveStream.objects.filter(event=event, stream_status='live').first()
            if existing_stream:
                existing_stream.room_id = room_id
                existing_stream.save()
                serializer = LiveStreamSerializer(existing_stream)
                return Response(serializer.data, status=status.HTTP_200_OK)

            live_stream = LiveStream.objects.create(
                event=event,
                room_id=room_id,
                stream_status=stream_status,
                organizer=request.user )

            serializer = LiveStreamSerializer(live_stream)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating live stream: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LiveStreamDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        try:
            live_stream = LiveStream.objects.filter(
                event__id=event_id, 
                stream_status='live'
            ).order_by('-created_at').first()
            
            if not live_stream:
                return Response(
                    {"error": "No active livestream found for this event"}, 
                    status=status.HTTP_404_NOT_FOUND )
                
            serializer = LiveStreamSerializer(live_stream)
            return Response(serializer.data)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    def put(self, request, event_id):
        try:
            live_stream = get_object_or_404(
                LiveStream, 
                event__id=event_id, 
                stream_status='live' )
            
            if live_stream.organizer != request.user:
                return Response(
                    {"error": "You don't have permission to update this stream"}, 
                    status=status.HTTP_403_FORBIDDEN)
                
            stream_status = request.data.get('stream_status')
            if stream_status:
                live_stream.stream_status = stream_status
                live_stream.save()
                
            serializer = LiveStreamSerializer(live_stream)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GetEvent(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, reqeust, event_id):
        try:
            event = Event.objects.get(id=event_id)
            seriazlier = EventCompleteDataSerializer(event)
            return Response(seriazlier.data)
        except Event.DoesNotExist:
            return Response({"error": "Event does not exist"}, status=status.HTTP_400_BAD_REQUEST)