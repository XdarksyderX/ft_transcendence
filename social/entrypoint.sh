#!/bin/bash


service postgresql start
sleep 5

#if [[ "$DROP_DB" == "TRUE" ]]; then
#	if [[ -x "./dropdb.sh" ]]; then
#		./dropdb.sh || { echo "Error: dropdb.sh failed to execute." >&2; }
#	else
#		echo "Error: dropdb.sh not found or not executable." >&2
#	fi
#fi


su postgres -c "psql -c \"CREATE USER $SOCIALDB_USER WITH PASSWORD '$SOCIALDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $SOCIALDB_NAME OWNER $SOCIALDB_USER;\""
su postgres -c "psql -c \"ALTER USER $SOCIALDB_USER CREATEDB;\""

python3 service/manage.py makemigrations core
python3 service/manage.py migrate

redis-server &

cd service

celery -A config worker --loglevel=info --queues=auth.user_registered,auth.user_deleted,auth.username_changed,pong.match_invitation,pong.tournament_invitation,consistency.subscribe_now.social &

celery -A config flower --port=5555 &
exec python manage.py runserver 0.0.0.0:5051
