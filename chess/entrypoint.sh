#!/bin/bash

service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $AUTHDB_USER WITH PASSWORD '$AUTHDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $AUTHDB_NAME OWNER $AUTHDB_USER;\""
su postgres -c "psql -c \"ALTER USER $AUTHDB_USER CREATEDB;\""

redis-server &  # Run redis-server in the background # TODO Ver si asi se ejecuta bien redis

python3 service/manage.py makemigrations core
python3 service/manage.py makemigrations
python3 service/manage.py migrate

exec python service/manage.py runserver 0.0.0.0:5000