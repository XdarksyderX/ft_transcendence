from django.urls import path, include
from core.exceptions.global_handler import (
    custom_bad_request,
    custom_permission_denied,
    custom_page_not_found,
    custom_server_error
)

urlpatterns = [
    path('', include('access.urls')),
    path('', include('change.urls')),
    path('', include('activate.urls')),
	path('', include('core.consistency.urls'))
]

handler400 = custom_bad_request
handler403 = custom_permission_denied
handler404 = custom_page_not_found
handler500 = custom_server_error