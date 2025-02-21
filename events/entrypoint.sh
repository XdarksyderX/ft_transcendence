service postgresql start
sleep 5

#if [[ "$DROP_DB" == "TRUE" ]]; then
#	if [[ -x "./dropdb.sh" ]]; then
#		./dropdb.sh || { echo "Error: dropdb.sh failed to execute." >&2; }
#	else
#		echo "Error: dropdb.sh not found or not executable." >&2
#	fi
#fi


su postgres -c "psql -c \"CREATE USER $EVENTSDB_USER WITH PASSWORD '$EVENTSDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $EVENTSDB_NAME OWNER $EVENTSDB_USER;\""
su postgres -c "psql -c \"ALTER USER $EVENTSDB_USER CREATEDB;\""

redis-server &

python3 service/manage.py makemigrations events
python3 service/manage.py migrate