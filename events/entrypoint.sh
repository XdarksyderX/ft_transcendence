#!/bin/bash

service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $PONGDB_USER WITH PASSWORD '$PONGDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $PONGDB_NAME OWNER $PONGDB_USER;\""
su postgres -c "psql -c \"ALTER USER $PONGDB_USER CREATEDB;\""


python3 service/manage.py makemigrations core
python3 service/manage.py migrate

export DJANGO_SETTINGS_MODULE=config.settings
export PYTHONPATH=/service

cd service

celery -A config worker --loglevel=info --queues=pong.user_registered,pong.user_deleted,pong.username_changed,pong.friend_added,pong.friend_removed &

celery -A config flower --port=5555 &
exec python manage.py runserver 0.0.0.0:5053