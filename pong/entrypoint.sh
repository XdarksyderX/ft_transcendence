#!/bin/bash

service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $PONGDB_USER WITH PASSWORD '$PONGDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $PONGDB_NAME OWNER $PONGDB_USER;\""
su postgres -c "psql -c \"ALTER USER $PONGDB_USER CREATEDB;\""

python3 service/manage.py makemigrations core
python3 service/manage.py makemigrations
python3 service/manage.py migrate

exec python service/manage.py runserver 0.0.0.0:5000
