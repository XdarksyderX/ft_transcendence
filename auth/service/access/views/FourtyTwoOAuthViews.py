from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.shortcuts import redirect
from django.conf import settings

class FortyTwoOAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = settings.SOCIAL_AUTH_42_KEY
        redirect_uri = settings.SOCIAL_AUTH_42_REDIRECT_URI
        authorization_url = (
            f"https://api.intra.42.fr/oauth/authorize?"
            f"client_id={client_id}&redirect_uri={redirect_uri}&response_type=code"
        )
        return redirect(authorization_url)

