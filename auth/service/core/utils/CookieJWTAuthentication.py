from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('access_token')
        if not token:
            return None
        try:
            validated_token = self.get_validated_token(token)
            user = self.get_user(validated_token)
            print(user)
            return (user, validated_token)
        except Exception:
            return None
