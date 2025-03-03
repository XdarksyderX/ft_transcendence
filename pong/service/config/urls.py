from django.urls import path, include

urlpatterns = [
    path('', include('matches.urls')),
	path('', include('stats.urls')),
]

handler404 = 'core.exceptions.global_handler.page_not_found'

