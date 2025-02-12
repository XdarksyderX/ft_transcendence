from django.urls import path, include

urlpatterns = [
    path('', include('friends.api.urls')),
	path('', include('core.consistency.urls'))
    #path('', include('chat.api.urls')),
]

handler404 = 'core.exceptions.global_handler.page_not_found'