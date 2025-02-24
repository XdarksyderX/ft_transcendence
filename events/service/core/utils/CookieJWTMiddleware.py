from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from asgiref.sync import sync_to_async
from core.utils.CookieJWTAuthentication import CookieJWTAuthentication

class CookieJWTMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):
        headers = dict(scope["headers"])
        cookies = headers.get(b"cookie", b"").decode("utf-8") if b"cookie" in headers else ""
        cookie_dict = {kv.split("=")[0]: kv.split("=")[1] for kv in cookies.split("; ") if "=" in kv}

        jwt_token = cookie_dict.get("access_token", None)

        if not jwt_token:
            auth_header = headers.get(b"authorization", b"").decode("utf-8")
            if auth_header and auth_header.startswith("Bearer "):
                jwt_token = auth_header.split(" ")[1]

        if jwt_token:
            user = await self.get_user_from_token(jwt_token)
        else:
            user = AnonymousUser()
        scope["user"] = user
        return await super().__call__(scope, receive, send)

    @sync_to_async
    def get_user_from_token(self, token):
        auth = CookieJWTAuthentication()
        try:
            validated_token = auth.get_validated_token(token)
            user = auth.get_user(validated_token)
            return user
        except Exception:
            return AnonymousUser()
