from celery import Celery
from kombu import Queue, Exchange
import os

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_DEFAULT_USER = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
RABBITMQ_DEFAULT_PASS = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

BROKER_URL = f'pyamqp://{RABBITMQ_DEFAULT_USER}:{RABBITMQ_DEFAULT_PASS}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}'

app = Celery("notifications", broker=BROKER_URL)

app.conf.task_queues = (
    Queue("notifications.social.avatar_changed", Exchange("social"), routing_key="social.avatar_changed"),
    Queue("notifications.social.friend_added", Exchange("social"), routing_key="social.friend_added"),
    Queue("notifications.social.friend_removed", Exchange("social"), routing_key="social.friend_removed"),
    Queue("notifications.social.request_declined", Exchange("social"), routing_key="social.request_declined"),
    Queue("notifications.social.request_cancelled", Exchange("social"), routing_key="social.request_cancelled"),
    Queue("notifications.social.request_sent", Exchange("social"), routing_key="social.request_sent"),
    Queue('notifications.auth.user_registered', Exchange('auth'), routing_key='auth.user_registered'),
    Queue('notifications.auth.username_changed', Exchange('auth'), routing_key='auth.username_changed'),
    Queue('notifications.auth.user_deleted', Exchange('auth'), routing_key='auth.user_deleted'),
    Queue('notifications.pong.match_invitation', Exchange('pong'), routing_key='pong.match_invitation'),
    Queue('notifications.pong.match_accepted', Exchange('pong'), routing_key='pong.match_accepted'),
    Queue('notifications.pong.invitation_cancelled', Exchange('pong'), routing_key='pong.invitation_cancelled'),
    Queue('notifications.pong.invitation_decline', Exchange('pong'), routing_key='pong.invitation_decline'),
    Queue('notifications.pong.tournament_invitation', Exchange('pong'), routing_key='pong.tournament_invitation'),
    Queue('notifications.pong.tournament_invitation.accepted', Exchange('pong'), routing_key='pong.tournament_invitation.accepted'),
	Queue('notifications.pong.tournament_invitation.deny', Exchange('pong'), routing_key='pong.tournament_invitation.deny'),
    Queue('notifications.pong.tournament_closed', Exchange('pong'), routing_key='pong.tournament_closed'),
    Queue('notifications.pong.tournament_deleted', Exchange('pong'), routing_key='pong.tournament_deleted'),
    Queue('notifications.pong.tournament_match_ready', Exchange('pong'), routing_key='pong.tournament_match_ready'),
    Queue('notifications.pong.tournament_match_waiting', Exchange('pong'), routing_key='pong.tournament_match_waiting'),
	Queue('notifications.pong.tournament_match_finished', Exchange('pong'), routing_key='pong.tournament_match_finished'),
	Queue('notifications.pong.tournament_round_finished', Exchange('pong'), routing_key='pong.tournament_round_finished'),
    Queue('notifications.chess.match_accepted', Exchange('chess'), routing_key='chess.match_accepted'),
    Queue('notifications.chess.invitation_cancelled', Exchange('chess'), routing_key='chess.invitation_cancelled'),
    Queue('notifications.chess.invitation_decline', Exchange('chess'), routing_key='chess.invitation_decline'),
    Queue('notifications.chess.match_accepted_random', Exchange('chess'), routing_key='chess.match_accepted_random'),
)

app.conf.task_routes = {
    "auth.user_deleted": {"queue": "notifications.auth.user_deleted"},
    "auth.user_registered": {"queue": "notifications.auth.user_registered"},
    "auth.username_changed": {"queue": "notifications.auth.username_changed"},
    "social.friend_added": {"queue": "notifications.social.friend_added"},
    "social.friend_removed": {"queue": "notifications.social.friend_removed"},
    "social.request_declined": {"queue": "notifications.social.request_declined"},
    "social.request_cancelled": {"queue": "notifications.social.request_cancelled"},
    "social.request_sent": {"queue": "notifications.social.request_sent"},
    "social.avatar_changed": {"queue": "notifications.social.avatar_changed"},
    "pong.match_accepted": {"queue": "notifications.pong.match_accepted"},
    "pong.invitation_cancelled": {"queue": "notifications.pong.invitation_cancelled"},
    "pong.invitation_decline": {"queue": "notifications.pong.invitation_decline"},
    "pong.tournament_invitation": {"queue": "notifications.pong.tournament_invitation"},
    "pong.tournament_invitation.accepted": {"queue": "notifications.pong.tournament_invitation.accepted"},
	"pong.tournament_invitation.deny": {"queue": "notifications.pong.tournament_invitation.deny"},
    "pong.tournament_closed": {"queue": "notifications.pong.tournament_closed"},
    "pong.tournament_deleted": {"queue": "notifications.pong.tournament_deleted"},
    "pong.tournament_match_waiting": {"queue": "notifications.pong.tournament_match_waiting"},
    "pong.tournament_match_ready": {"queue": "notifications.pong.tournament_match_ready"},
	"pong.tournament_match_finished": {"queue": "notifications.pong.tournament_match_finished"},
	"pong.tournament_round_finished": {"queue": "notifications.pong.tournament_round_finished"},
    "chess.match_accepted": {"queue": "notifications.chess.match_accepted"},
    "chess.invitation_cancelled": {"queue": "notifications.chess.invitation_cancelled"},
    "chess.invitation_decline": {"queue": "notifications.chess.invitation_decline"},
    "chess.match_accepted_random": {"queue": "notifications.chess.match_accepted_random"},
}

app.autodiscover_tasks(["config.tasks"])