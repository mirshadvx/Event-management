from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('Admin/', admin.site.urls),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/admin/', include('Admin.urls')),
    path('api/v1/event/',include('event.urls')),
    path('api/v1/chat/',include('chat.urls')),
    path('api/v1/organizer/',include('organizer.urls')),
    path('api/v1/profile/',include('Profile.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)