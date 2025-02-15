from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, NotFound, MethodNotAllowed

def global_exception_handler(exc, context):
    if isinstance(exc, AuthenticationFailed) or isinstance(exc, NotAuthenticated):
        return Response({
            "status": "error",
            "message": "Authentication credentials were not provided or are invalid."
        }, status=status.HTTP_401_UNAUTHORIZED)

    if isinstance(exc, NotFound):
        return Response({
            "status": "error",
            "message": "Resource not found."
        }, status=status.HTTP_404_NOT_FOUND)

    if isinstance(exc, MethodNotAllowed):
        return Response({
            "status": "error",
            "message": "Method not allowed."
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    response = exception_handler(exc, context)

    if response is None:
        return Response({
            "status": "error",
            "message": "An unexpected error occurred."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response

def page_not_found(request, exception):
    return Response({
        "status": "error",
        "message": "Resource not found."
    }, status=status.HTTP_404_NOT_FOUND)