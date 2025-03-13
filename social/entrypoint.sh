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


sudo -u postgres psql -c "CREATE USER $SOCIALDB_USER WITH PASSWORD '$SOCIALDB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $SOCIALDB_NAME OWNER $SOCIALDB_USER;"
sudo -u postgres psql -c "ALTER USER $SOCIALDB_USER CREATEDB;"


python3 service/manage.py makemigrations core
python3 service/manage.py migrate

export PYTHONPATH=$(pwd)/service:$PYTHONPATH
export DJANGO_SETTINGS_MODULE=service.config.settings

celery -A service.config worker --loglevel=info --queues=social.user_registered,social.user_deleted,social.username_changed,social.pong.match_invitation,social.pong.tournament_invitation,events.user_connected,events.user_disconnected,SOCIAL.match_invitation&
celery -A service.config flower --port=5555 &

exec python service/manage.py runserver 0.0.0.0:5051
