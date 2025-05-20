from django.urls import path
from .views import *

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversation_list'),
    path('conversations/<int:conversation_id>/messages/', MessageListCreateView.as_view(), name='message_list_create'),
    path('conversations/<int:conversation_id>/messages/<int:pk>/', MessageRetrieveDestroyView.as_view(), name='message_detail_destroy'),
    path('get-ws-token/', PassSocketToken.as_view(), name='get_ws_token'),
    path('group-conversations/', GroupConversationListView.as_view(), name='group-conversation-list'),
    path('group-conversations/<int:pk>/', GroupConversationDetailView.as_view(), name='group-conversation-detail'),
    path('group-conversations/<int:group_id>/messages/', GroupMessageListCreateView.as_view(), name='group-message-list-create'),
    path('group-conversations/<int:group_id>/messages/<int:pk>/', GroupMessageRetrieveDestroyView.as_view(), name='group-message-detail'),
    path('group-messages/<int:message_id>/read/', MarkGroupMessageAsReadView.as_view(), name='mark-group-message-read'),
    path('notifications/', NotificationList.as_view(), name='notification-list'),
    path('notifications/<int:pk>/', NotificationDetail.as_view(), name='notification-detail'),
]