from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timezone, timedelta
from django.utils.http import http_date
from core.models import User
from core.utils.rabbitmq_client import RabbitMQClient
from core.utils.event_domain import wrap_event_data


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {"status": "error", "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            old_refresh = RefreshToken(refresh_token)
            user_id = old_refresh.payload.get('user_id')
            if not user_id:
                return Response(
                    {"status": "error", "message": "Invalid token payload."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user = User.objects.get(id=user_id)
            old_refresh.blacklist()
            new_refresh = RefreshToken.for_user(user)
            access_token = str(new_refresh.access_token)
            new_refresh["user_id"] = user.id
            new_refresh["username"] = user.username
            new_refresh["two_fa_enabled"] = user.two_fa_enabled
            new_refresh["oauth_registered"] = user.oauth_registered
            expiration = datetime.now(timezone.utc) + timedelta(days=7)

            response = Response(
                {"status": "success", "access_token": access_token},
                status=status.HTTP_200_OK
            )

            response.set_cookie(
                key='refresh_token',
                value=str(new_refresh),
                httponly=True,
                expires=http_date(expiration.timestamp()),
                samesite='Strict'
            )

            rabbit_client = RabbitMQClient()
            try:
                event_data = wrap_event_data(
                    data={
                        "user_id": user_id,
                        "username": old_refresh.payload.get('username')
                    },
                    event_type="auth.token_refreshed",
                    aggregate_id=str(user_id)
                )
                rabbit_client.publish(
                    exchange='auth',
                    routing_key='auth.token_refreshed',
                    message=event_data
                )
            finally:
                rabbit_client.close()

            return response

        except Exception:
            return Response(
                {"status": "error", "message": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )