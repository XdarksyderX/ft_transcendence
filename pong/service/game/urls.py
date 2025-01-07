from django.urls import path
from .views import test_view

urlpatterns = [
    path('', views.index, name='index'),  # Example route
]