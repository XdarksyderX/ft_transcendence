PGPASSWORD=$NOTIFICATIONSDB_PASSWORD dropdb --host=$NOTIFICATIONSDB_HOST --port=$NOTIFICATIONSDB_PORT --username=$NOTIFICATIONSDB_USER --if-exists $NOTIFICATIONSDB_NAME