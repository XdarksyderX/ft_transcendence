import pika
import json
from django.conf import settings

class RabbitMQClient:
    def __init__(self):
        self.mock_enabled = not settings.AMQP_ENABLED

        if not self.mock_enabled:
            credentials = pika.PlainCredentials(settings.RABBITMQ_USER, settings.RABBITMQ_PASSWORD)
            parameters = pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=settings.RABBITMQ_PORT,
                virtual_host=settings.RABBITMQ_VHOST,
                credentials=credentials
            )
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
        else:
            self.connection = None
            self.channel = None

    def publish(self, exchange, routing_key, message):
        if self.mock_enabled:
            print(f"[MOCK] Publishing message to exchange '{exchange}' with routing key '{routing_key}': {json.dumps(message)}")
        else:
            self.channel.basic_publish(
                exchange=exchange,
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                )
            )

    def close(self):
        if not self.mock_enabled and self.connection and self.connection.is_open:
            self.connection.close()