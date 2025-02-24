service postgresql start
sleep 5

#if [[ "$DROP_DB" == "TRUE" ]]; then
#	if [[ -x "./dropdb.sh" ]]; then
#		./dropdb.sh || { echo "Error: dropdb.sh failed to execute." >&2; }
#	else
#		echo "Error: dropdb.sh not found or not executable." >&2
#	fi
#fi


su postgres -c "psql -c \"CREATE USER $NOTIFICATIONSDB_USER WITH PASSWORD '$NOTIFICATIONSDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $NOTIFICATIONSDB_NAME OWNER $NOTIFICATIONSDB_USER;\""
su postgres -c "psql -c \"ALTER USER $NOTIFICATIONSDB_USER CREATEDB;\""

python3 service/manage.py makemigrations core
python3 service/manage.py migrate

celery -A service.config worker --loglevel=info --queues=events.social.avatar_changed,events.social.friend_added,events.social.friend_removed,events.social.request_declined,events.social.request_cancelled,events.social.request_sent &

exec python manage.py runserver 0.0.0.0:5054

