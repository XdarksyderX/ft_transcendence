#!/bin/bash

PYTHONPATH=/service

wait_for_rabbitmq() {
    until nc -z "$RABBITMQ_HOST" "$RABBITMQ_PORT"; do
        echo "Waiting for RabbitMQ..."
        sleep 2
    done
    echo "RabbitMQ is up."
}


start_celery() {
    celery -A service worker --loglevel=info &
    celery -A service beat --loglevel=info &
    wait -n
}

wait_for_rabbitmq
start_celery
