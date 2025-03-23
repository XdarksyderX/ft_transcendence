#!/bin/sh


# Initialize PostgreSQL
sudo -u postgres initdb -D /var/lib/postgresql/data
sudo -u postgres postgres -D /var/lib/postgresql/data &


until pg_isready -h localhost -p 5432; do
echo "Waiting for PostgreSQL to be available..."
  sleep 1
done

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

celery -A config worker --loglevel=info --queues=consistency.subscribe_now.auth &

exec python3 manage.py runserver 0.0.0.0:5050
# !/bin/sh