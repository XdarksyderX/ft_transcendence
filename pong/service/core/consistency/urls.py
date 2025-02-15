from django.urls import path
from core.consistency.views import OutgoingEventsView, IncomingEventsView

urlpatterns = [
    path("events/outgoing/", OutgoingEventsView.as_view(), name="outgoing_events"),
    path("events/incoming/", IncomingEventsView.as_view(), name="incoming_events"),
]
