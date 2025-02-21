from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.exceptions.global_handler import (
    custom_bad_request,
    custom_permission_denied,
    custom_page_not_found,
    custom_server_error
)

urlpatterns = [
    path('', include('friends.api.urls')),
    path('', include('chat.api.urls')),
	path('', include('core.consistency.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler400 = custom_bad_request
handler403 = custom_permission_denied
handler404 = custom_page_not_found
handler500 = custom_server_error