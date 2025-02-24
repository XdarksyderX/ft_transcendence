from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from core.models import OutgoingEvent, IncomingEvent

def validate_consistency_service(request):
    token = request.headers.get("Authorization")
    return token == settings.CONSISTENCY_TOKEN

@method_decorator(csrf_exempt, name="dispatch")
class OutgoingEventsView(APIView):
    def get(self, request):
        if not validate_consistency_service(request):
            return Response({"status": "error", "message": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        events = OutgoingEvent.objects.all().values("event_id", "event_type", "timestamp", "data")
        return Response({"status": "success", "events": list(events)}, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name="dispatch")
class IncomingEventsView(APIView):
    def get(self, request):
        if not validate_consistency_service(request):
            return Response({"status": "error", "message": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        events = IncomingEvent.objects.all().values("event_id", "event_type", "timestamp")
        return Response({"status": "success", "events": list(events)}, status=status.HTTP_200_OK)
