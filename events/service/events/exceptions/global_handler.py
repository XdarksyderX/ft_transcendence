from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class GlobalExceptionMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        print(exception)

        if isinstance(exception, PermissionError):
            return JsonResponse({
                "status": "error",
                "message": "Permission denied."
            }, status=403)

        return JsonResponse({
            "status": "error",
            "message": "An unexpected error occurred."
        }, status=500)


def custom_bad_request(request, exception):
    return JsonResponse({
        "status": "error",
        "message": "Bad request."
    }, status=400)


def custom_permission_denied(request, exception):
    return JsonResponse({
        "status": "error",
        "message": "Permission denied."
    }, status=403)


def custom_page_not_found(request, exception):
    return JsonResponse({
        "status": "error",
        "message": "Resource not found."
    }, status=404)


def custom_server_error(request):
    return JsonResponse({
        "status": "error",
        "message": "An unexpected error occurred."
    }, status=500)
