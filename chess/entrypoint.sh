#!/bin/bash

service postgresql start
sleep 5

sudo -u postgres psql -c "CREATE USER $CHESSDB_USER WITH PASSWORD '$CHESSDB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $CHESSDB_NAME OWNER $CHESSDB_USER;"
sudo -u postgres psql -c "ALTER USER $CHESSDB_USER CREATEDB;"


python3 service/manage.py makemigrations core
python3 service/manage.py migrate

cd service

celery -A config worker --loglevel=info --queues=chess.user_registered,chess.user_deleted,chess.username_changed,chess.friend_added,chess.friend_removed &

celery -A config flower --port=5555 &
exec python manage.py runserver 0.0.0.0:5053