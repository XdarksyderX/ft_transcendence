#!/bin/bash

service postgresql start
sleep 5

if [[ "$DROP_DB" == "TRUE" ]]; then
	if [[ -x "./dropdb.sh" ]]; then
		./dropdb.sh || { echo "Error: dropdb.sh failed to execute." >&2; }
	else
		echo "Error: dropdb.sh not found or not executable." >&2
	fi
fi

sudo -u postgres psql -c "CREATE USER $AUTHDB_USER WITH PASSWORD '$AUTHDB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $AUTHDB_NAME OWNER $AUTHDB_USER;"
sudo -u postgres psql -c "ALTER USER $AUTHDB_USER CREATEDB;"

python3 service/manage.py makemigrations core
python3 service/manage.py makemigrations
python3 service/manage.py migrate

cd service

exec python manage.py runserver 0.0.0.0:5050
