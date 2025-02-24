#!/bin/bash

# Esperar a que RabbitMQ esté disponible
wait_for_rabbitmq() {
    until nc -z "$RABBITMQ_HOST" "$RABBITMQ_PORT"; do
        echo "Waiting for RabbitMQ..."
        sleep 2
    done
    echo "RabbitMQ is up."
}

# Lanzar Celery worker y beat
start_celery() {
    # Lanzar el worker escuchando todas las colas
    celery -A service.config worker --loglevel=info -Q consistency.subscribe,consistency.check,default &

    # Lanzar celery-beat
    celery -A service.config beat --loglevel=info &

    # Esperar a que algún proceso finalice
    wait -n
}

# Ejecutar funciones
wait_for_rabbitmq
start_celery
