#!/bin/bash
# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'


# Configuración adicional de PostgreSQL
echo "Configurando pg_hba.conf"
echo 'local all postgres md5' >> "$PGDATA/pg_hba.conf"

# Actualizaciones adicionales de configuración, por ejemplo:
echo "listen_addresses='*'" >> "$PGDATA/postgresql.conf"


# Config PostgreSQL
service postgresql start
su - postgres
# psql -c "CREATE USER admin WITH PASSWORD '$PostgreSQL_User' SUPERUSER;"
# psql -c "CREATE DATABASE $PostgreSQL_DBName OWNER $PostgreSQL_User;"
# psql -c "GRANT ALL PRIVILEGES ON DATABASE $PostgreSQL_DBName TO $PostgreSQL_User;"
su - postgres -c "psql -c \"CREATE USER $PostgreSQL_User WITH PASSWORD '$POSTGRES_PASSWORD' SUPERUSER;\""
su - postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB OWNER $PostgreSQL_User;\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $PostgreSQL_User;\""

service postgresql restart



# Add password of PostgreSQL in Django connector
echo "localhost:5432:$POSTGRES_DB:$PostgreSQL_User:$POSTGRES_PASSWORD" > /conf/.pgpass
# NOSE SI HAY QUE METER PERMISOS

# Make Migrations
python3 manage.py makemigrations
python3 manage.py migrate

# Create the superuser
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', '${DJANGO_ADMIN_PASSWORD}')"


# Run the development server
exec "$@"

