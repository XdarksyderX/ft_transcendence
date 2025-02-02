#!/bin/bash

service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $SOCIALDB_USER WITH PASSWORD '$SOCIALDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $SOCIALDB_NAME OWNER $SOCIALDB_USER;\""
su postgres -c "psql -c \"ALTER USER $SOCIALDB_USER CREATEDB;\""

# redis-server &  # Run redis-server in the background # TODO Ver si asi se ejecuta bien redis

python3 /var/www/servicemanage.py makemigrations core
python3 /var/www/servicemanage.py makemigrations
python3 /var/www/servicemanage.py migrate

exec python /var/www/servicemanage.py runserver 0.0.0.0:5000
