from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', include('friends.api.urls')),
	path('', include('core.consistency.urls'))
    #path('', include('chat.api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = 'core.exceptions.global_handler.page_not_found'