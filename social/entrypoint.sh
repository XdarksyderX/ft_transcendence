#!/bin/bash

service postgresql start
sleep 5

su postgres -c "psql -c \"CREATE USER $SOCIALDB_USER WITH PASSWORD '$SOCIALDB_PASSWORD';\""
su postgres -c "psql -c \"CREATE DATABASE $SOCIALDB_NAME OWNER $SOCIALDB_USER;\""
su postgres -c "psql -c \"ALTER USER $SOCIALDB_USER CREATEDB;\""

redis-server &


python3 service/manage.py makemigrations core
python3 service/manage.py migrate

export PYTHONPATH=/service
export DJANGO_SETTINGS_MODULE=config.settings

cd service

celery -A config worker --loglevel=info --queues=social.user_registered,social.user_deleted,social.username_changed &
celery -A config flower --port=5555 &
exec python manage.py runserver 0.0.0.0:5051
