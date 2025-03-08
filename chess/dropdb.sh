#!/bin/bash

PGPASSWORD=$CHESSDB_PASSWORD dropdb --host=$CHESSDB_HOST --port=$CHESSDB_PORT --username=$CHESSDB_USER --if-exists $CHESSDB_NAME
