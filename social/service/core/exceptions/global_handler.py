from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated

def global_exception_handler(exc, context):
    if isinstance(exc, AuthenticationFailed) or isinstance(exc, NotAuthenticated):
        return Response({
            "status": "error",
            "message": "Authentication credentials were not provided or are invalid."
        }, status=status.HTTP_401_UNAUTHORIZED)

    response = exception_handler(exc, context)
    
    if response is None:
        return Response({
            "status": "error",
            "message": "An unexpected error occurred."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
