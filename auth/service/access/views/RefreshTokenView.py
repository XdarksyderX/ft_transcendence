from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timezone, timedelta
from django.utils.http import http_date
from core.models import User
from core.utils.event_domain import publish_event


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
            refresh_token = RefreshToken(refresh_token)
            user_id = refresh_token.payload.get('user_id')
            if not user_id:
                return Response(
                    {"status": "error", "message": "Invalid token payload."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user = User.objects.get(id=user_id)
            refresh_token["username"] = user.username
            refresh_token["two_fa_enabled"] = user.two_fa_enabled
            refresh_token["oauth_registered"] = user.oauth_registered
            refresh_token["user_id"] = user.id

            access_token = refresh_token.access_token
            access_token["user_id"] = user.id
            access_token["username"] = user.username
            access_token["two_fa_enabled"] = user.two_fa_enabled
            access_token["oauth_registered"] = user.oauth_registered



            expiration = datetime.now(timezone.utc) + timedelta(days=7)

            response = Response(
                {"status": "success", "access_token": str(access_token)},
                status=status.HTTP_200_OK
            )

            access_exp = datetime.fromtimestamp(access_token["exp"], tz=timezone.utc)
            refresh_exp = datetime.fromtimestamp(refresh_token["exp"], tz=timezone.utc)

            response.set_cookie(
                key='access_token',
                value=str(access_token),
                httponly=True,
                secure=True,
                expires=http_date(access_exp.timestamp()),
                samesite='None'
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh_token),
                httponly=True,
                secure=True,
                expires=http_date(refresh_exp.timestamp()),
                samesite='None'
            )
            publish_event("auth", "auth.token_refreshed", {"user_id": user.id, "username": user.username})
            return response

        except Exception:
            response = Response(
                {"status": "error", "message": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie('refresh_token')
            return response