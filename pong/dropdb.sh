#!/bin/bash

PGPASSWORD=$PONGDB_PASSWORD dropdb --host=$PONGDB_HOST --port=$PONGDB_PORT --username=$PONGDB_USER --if-exists $PONGDB_NAME
