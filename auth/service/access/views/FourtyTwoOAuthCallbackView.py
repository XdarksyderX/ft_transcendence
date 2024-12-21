import requests
import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.http import http_date
from core.models import User
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data

class FortyTwoCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return Response({"status": "error", "message": "Code is required"}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            'grant_type': 'authorization_code',
            'client_id': settings.SOCIAL_AUTH_42_KEY,
            'client_secret': settings.SOCIAL_AUTH_42_SECRET,
            'code': code,
            'redirect_uri': settings.SOCIAL_AUTH_42_REDIRECT_URI,
        }

        token_response = requests.post('https://api.intra.42.fr/oauth/token', data=data)
        if token_response.status_code != 200:
            return Response({"status": "error", "message": "Failed to get access token from 42"}, status=status.HTTP_401_UNAUTHORIZED)

        token_data = token_response.json()
        access_token = token_data['access_token']

        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        user_response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
        if user_response.status_code != 200:
            return Response({"status": "error", "message": "Failed to get user info from 42"}, status=status.HTTP_401_UNAUTHORIZED)

        user_data = user_response.json()
        username = user_data.get('login')
        email = user_data.get('email')

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': email, 'is_email_verified': True, 'oauth_registered': True}
        )

        refresh = RefreshToken.for_user(user)
        response = Response({
            "status": "success",
            "access_token": str(refresh.access_token),
        }, status=status.HTTP_200_OK)

        expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            httponly=True,
            expires=http_date(expiration.timestamp()),
            samesite='Strict'
        )

        rabbit_client = RabbitMQClient()
        try:
            event_data = wrap_event_data(
                data={
                    "username": user.username,
                    "email": user.email
                },
                event_type="auth.user_logged_in_oauth",
                aggregate_id=str(user.id)
            )
            rabbit_client.publish(exchange='auth', routing_key='auth.user_logged_in_oauth', message=event_data)
        finally:
            rabbit_client.close()

        return response
