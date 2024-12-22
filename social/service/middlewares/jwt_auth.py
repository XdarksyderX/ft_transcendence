import jwt
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from social.models import User # TODO middleware: de que modelo importo ver si esta bien

class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware para verificar JWT en el encabezado de autorización y
    asociar al usuario autenticado con la solicitud.
    """
    def process_request(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')

            try:
                user = User.objects.get(user_id=user_id)
                request.user = user
            except User.DoesNotExist:
                request.user = None

        except jwt.ExpiredSignatureError:
            request.user = None
        except jwt.InvalidTokenError:
            request.user = None