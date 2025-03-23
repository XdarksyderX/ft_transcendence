#!/bin/sh

PGPASSWORD=$AUTHDB_PASSWORD dropdb --host=$AUTHDB_HOST --port=$AUTHDB_PORT --username=$AUTHDB_USER --if-exists $AUTHDB_NAME