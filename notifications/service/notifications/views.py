from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Notification

class PendingNotificationsView(APIView):

	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		pending_notifications = Notification.objects.filter(receiver=user)
		data = [{"id": n.id, "content": n.content, "created_at": n.created_at} for n in pending_notifications]
		response = {
			"status": "success",
			"notifications": data
		}
		return Response(response)

class MarkNotification(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		print(request.data)
		notification_id = request.data.get('notification_id')
		if not notification_id:
			return Response({'status': 'error', 'message': 'Notification ID is required'}, status=400)

		try:
			notification = Notification.objects.get(id=notification_id, receiver=request.user)
			notification.delete()
			return Response({'status': 'success', 'message': 'Notification marked as read'})
		except Notification.DoesNotExist:
			return Response({'status': 'error', 'message': 'Notification not found'}, status=404)

