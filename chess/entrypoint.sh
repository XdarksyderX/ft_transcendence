#!/bin/bash



# Debug: Print environment variables
echo "CHESSDB_USER: $CHESSDB_USER"
echo "CHESSDB_PASSWORD: $CHESSDB_PASSWORD"
echo "CHESSDB_NAME: $CHESSDB_NAME"

service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $CHESSDB_USER WITH PASSWORD '$CHESSDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $CHESSDB_NAME OWNER $CHESSDB_USER;\""
su postgres -c "psql -c \"ALTER USER $CHESSDB_USER CREATEDB;\""

python3 service/manage.py makemigrations core
python3 service/manage.py migrate

cd service

celery -A config worker --loglevel=info --queues=CHESS.user_registered,CHESS.user_deleted,CHESS.username_changed,CHESS.friend_added,CHESS.friend_removed &

celery -A config flower --port=5555 &
exec python manage.py runserver 0.0.0.0:5053