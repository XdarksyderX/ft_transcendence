from django.conf.urls import handler400, handler403, handler404, handler500
from django.urls import path, include
from core.exceptions import (
    custom_bad_request, 
    custom_permission_denied, 
    custom_page_not_found, 
    custom_server_error
)

urlpatterns = [
    path('', include('notifications.urls')),
]

handler400 = custom_bad_request
handler403 = custom_permission_denied
handler404 = custom_page_not_found
handler500 = custom_server_error
