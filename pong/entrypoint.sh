#!/bin/bash

service postgresql start
sleep 5

sudo -u postgres psql -c "CREATE USER $PONGDB_USER WITH PASSWORD '$PONGDB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $PONGDB_NAME OWNER $PONGDB_USER;"
sudo -u postgres psql -c "ALTER USER $PONGDB_USER CREATEDB;"

python3 service/manage.py makemigrations core
python3 service/manage.py migrate

cd service

celery -A config worker --loglevel=info --queues=pong.user_registered,pong.user_deleted,pong.username_changed,pong.friend_added,pong.friend_removed,events.user_disconnected,pong.alias_changed &

celery -A config flower --port=5555 &
exec python manage.py runserver 0.0.0.0:5052