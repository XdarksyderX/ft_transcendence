service postgresql start
sleep 5

sudo -u postgres psql -c "CREATE USER $NOTIFICATIONSDB_USER WITH PASSWORD '$NOTIFICATIONSDB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $NOTIFICATIONSDB_NAME OWNER $NOTIFICATIONSDB_USER;"
sudo -u postgres psql -c "ALTER USER $NOTIFICATIONSDB_USER CREATEDB;"


export PYTHONPATH=$(pwd)/service:$PYTHONPATH
export DJANGO_SETTINGS_MODULE=service.config.settings

python3 service/manage.py makemigrations core
python3 service/manage.py migrate

celery -A service.config worker \
--loglevel=info \
--queues=notifications.social.avatar_changed,\
notifications.social.friend_added,\
notifications.social.friend_removed,\
notifications.social.request_declined,\
notifications.social.request_cancelled,\
notifications.social.request_sent,\
notifications.auth.user_registered,\
notifications.auth.user_deleted,\
notifications.auth.username_changed,\
notifications.pong.match_accepted,\
notifications.pong.invitation_cancelled,\
notifications.pong.invitation_decline,\
notifications.pong.tournament_invitation,\
notifications.pong.tournament_invitation.accepted,\
notifications.pong.tournament_invitation.decline,\
notifications.pong.tournament_closed,\
notifications.pong.tournament_deleted,\
notifications.pong.tournament_match_waiting,\
notifications.pong.tournament_match_ready,\
notifications.chess.match_accepted,\
notifications.chess.invitation_cancelled,\
notifications.chess.match_accepted_random,\
notifications.pong.tournament_match_finished,\
notifications.chess.invitation_decline &

exec python3 service/manage.py runserver 0.0.0.0:5054
