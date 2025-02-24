from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Notification
class PendingNotificationsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		pending_notifications = Notification.objects.filter(user=user, status='pending')
		data = [{"id": n.id, "message": n.message, "created_at": n.created_at} for n in pending_notifications]
		return Response(data)
