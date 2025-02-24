service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $NOTIFICATIONSDB_USER WITH PASSWORD '$NOTIFICATIONSDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $NOTIFICATIONSDB_NAME OWNER $NOTIFICATIONSDB_USER;\""
su postgres -c "psql -c \"ALTER USER $NOTIFICATIONSDB_USER CREATEDB;\""

export PYTHONPATH=$(pwd)/service:$PYTHONPATH
export DJANGO_SETTINGS_MODULE=service.config.settings

python3 service/manage.py makemigrations core
python3 service/manage.py migrate

celery -A service.config worker --loglevel=info --queues=notifications.social.avatar_changed,notifications.social.friend_added,notifications.social.friend_removed,notifications.social.request_declined,notifications.social.request_cancelled,notifications.social.request_sent,notifications.auth.user_registered,notifications.auth.user_deleted &

exec python3 service/manage.py runserver 0.0.0.0:5054
