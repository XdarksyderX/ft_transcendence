import json
import uuid
import pika
from django.conf import settings

class RabbitMQClient:
    _instance = None
    _declared_exchanges = set()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(RabbitMQClient, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.mock_enabled = not settings.AMQP_ENABLED
            self._connect()
            self.initialized = True

    def _connect(self):
        if not self.mock_enabled:
            try:
                credentials = pika.PlainCredentials(settings.RABBITMQ_DEFAULT_USER, settings.RABBITMQ_DEFAULT_PASS)
                parameters = pika.ConnectionParameters(
                    host=settings.RABBITMQ_HOST,
                    port=settings.RABBITMQ_PORT,
                    virtual_host=settings.RABBITMQ_VHOST,
                    credentials=credentials
                )
                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()
                print("Connected to RabbitMQ.")
            except pika.exceptions.AMQPConnectionError as e:
                print(f"Error connecting to RabbitMQ: {e}")
                self.connection = None
                self.channel = None
        else:
            self.connection = None
            self.channel = None
            print("Mock mode enabled. RabbitMQ will not be used.")

    def _ensure_connection(self):
        if self.connection is None or self.channel is None or self.connection.is_closed or self.channel.is_closed:
            print("Reconnecting to RabbitMQ...")
            self._connect()

    def declare_exchange(self, exchange):
        self._ensure_connection()
        if exchange not in self._declared_exchanges:
            self.channel.exchange_declare(exchange=exchange, exchange_type="direct", durable=True)
            self._declared_exchanges.add(exchange)
            print(f"Exchange '{exchange}' created.")

    def publish(self, exchange, routing_key, message):
        self._ensure_connection()
        if self.mock_enabled:
            print(f"[MOCK] Publishing message to exchange '{exchange}' with routing key '{routing_key}': {json.dumps(message)}")
        elif self.connection and self.connection.is_open and self.channel:
            try:
                self.declare_exchange(exchange)
                message = {
                    "task": routing_key,
                    "id": str(uuid.uuid4()),
                    "args": [message],
                    "kwargs": {},
                }
                self.channel.basic_publish(
                    exchange=exchange,
                    routing_key=routing_key,
                    body=json.dumps(message),
                    properties=pika.BasicProperties(
                        delivery_mode=2,
                        content_type="application/json"
                    )
                )
                print(f"Message sent to exchange '{exchange}' with routing key '{routing_key}': {message}")
            except pika.exceptions.AMQPError as e:
                print(f"Error sending message to RabbitMQ: {e}")

    def close(self):
        if not self.mock_enabled and self.connection and self.connection.is_open:
            self.connection.close()
            print("RabbitMQ connection closed.")
