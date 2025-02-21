from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed, NotAuthenticated, NotFound, MethodNotAllowed, PermissionDenied
)

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)

class GlobalExceptionMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        logger.error(f"Unhandled Exception: {exception}")

        if isinstance(exception, PermissionError):
            return JsonResponse({
                "status": "error",
                "message": "Permission denied."
            }, status=status.HTTP_403_FORBIDDEN)

        return JsonResponse({
            "status": "error",
            "message": "An unexpected error occurred."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def custom_error_response(message, http_status):
    return JsonResponse({
        "status": "error",
        "message": message
    }, status=http_status)

def custom_bad_request(request, exception):
    return custom_error_response("Bad request.", status.HTTP_400_BAD_REQUEST)

def custom_permission_denied(request, exception):
    return custom_error_response("Permission denied.", status.HTTP_403_FORBIDDEN)

def custom_page_not_found(request, exception):
    return custom_error_response("Resource not found.", status.HTTP_404_NOT_FOUND)

def custom_server_error(request):
    return custom_error_response("An unexpected error occurred.", status.HTTP_500_INTERNAL_SERVER_ERROR)

# Global Exception Handler DRF
def global_exception_handler(exc, context):
    exception_mapping = {
        (AuthenticationFailed, NotAuthenticated): (status.HTTP_401_UNAUTHORIZED, "Authentication credentials were not provided or are invalid."),
        (PermissionDenied,): (status.HTTP_403_FORBIDDEN, "Permission denied."),
        (NotFound,): (status.HTTP_404_NOT_FOUND, "Resource not found."),
        (MethodNotAllowed,): (status.HTTP_405_METHOD_NOT_ALLOWED, "Method not allowed."),
    }

    for exceptions, (http_status, message) in exception_mapping.items():
        if isinstance(exc, exceptions):
            return Response({
                "status": "error",
                "message": message
            }, status=http_status)

    response = exception_handler(exc, context)

    if response is None:
        logger.error(f"Unhandled DRF Exception: {exc}")
        return Response({
            "status": "error",
            "message": "An unexpected error occurred."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response

def page_not_found(request, exception):
    return custom_error_response("Resource not found.", status.HTTP_404_NOT_FOUND)
