from django.urls import path, include
from .views import PendingNotificationsView, MarkNotification, HasPendingNotificationsView

urlpatterns = [
	path('notifications/', PendingNotificationsView.as_view(), name='pending-notifications'),
	path('notifications/mark/', MarkNotification.as_view(), name='mark-notification'),
	path('notifications/has_pending/', HasPendingNotificationsView.as_view(), name='has-pending-notifications'),
]
