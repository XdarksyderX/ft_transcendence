#!/bin/bash

PGPASSWORD=$SOCIALDB_PASSWORD dropdb --host=$SOCIALDB_HOST --port=$SOCIALDB_PORT --username=$SOCIALDB_USER --if-exists $SOCIALDB_NAME
