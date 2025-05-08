from django.urls import path
from .views import *

urlpatterns = [
    path('organized-list/', OrganizedList.as_view(), name='organized_list'),
]