from django.urls import path
from . import views

urlpatterns = [
    path('tournaments/', views.TournamentView.as_view(), name='tournament-list-create'),
    path('tournaments/<int:tournament_id>/edit/', views.EditTournamentView.as_view(), name='edit-tournament'),
    path('tournaments/<int:tournament_id>/start/', views.StartTournamentView.as_view(), name='start-tournament'),
    path('tournaments/<int:tournament_id>/games/', views.TournamentGamesView.as_view(), name='tournament-games'),
]
