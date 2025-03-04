service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $NOTIFICATIONSDB_USER WITH PASSWORD '$NOTIFICATIONSDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $NOTIFICATIONSDB_NAME OWNER $NOTIFICATIONSDB_USER;\""
su postgres -c "psql -c \"ALTER USER $NOTIFICATIONSDB_USER CREATEDB;\""

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
notifications.pong.match_invitation,\
notifications.pong.match_accepted,\
notifications.pong.invitation_cancelled,\
notifications.pong.invitation_decline,\
notifications.pong.tournament_invitation,\
notifications.pong.tournament_cancelled,\
notifications.pong.tournament_decline \
notifications.chess.match_invitation,\
notifications.chess.match_accepted,\
notifications.chess.invitation_cancelled,\
notifications.chess.invitation_decline &

exec python3 service/manage.py runserver 0.0.0.0:5054
