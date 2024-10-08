#!/bin/bash
# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'


# Addiotional Config
echo 'local all postgres md5' >> "$PGDATA/pg_hba.conf"

# Config PostgreSQL
service postgresql start
su - postgres -c "psql -c \"CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD' SUPERUSER;\""
su - postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;\""
service postgresql restart

# Make Migrations
python3 manage.py makemigrations
python3 manage.py migrate

# Create the superuser
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', '${DJANGO_ADMIN_PASSWORD}')"

# Run the development server
exec "$@"

