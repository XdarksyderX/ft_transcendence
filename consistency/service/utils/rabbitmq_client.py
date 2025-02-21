import os
import json
import uuid
import pika

DEFAULT_CONFIG = {
    "AMQP_ENABLED": True,
    "RABBITMQ_DEFAULT_USER": os.getenv("RABBITMQ_DEFAULT_USER", "guest"),
    "RABBITMQ_DEFAULT_PASS": os.getenv("RABBITMQ_DEFAULT_PASS", "guest"),
    "RABBITMQ_HOST": os.getenv("RABBITMQ_HOST", "localhost"),
    "RABBITMQ_PORT": int(os.getenv("RABBITMQ_PORT", 5672)),
    "RABBITMQ_VHOST": os.getenv("RABBITMQ_VHOST", "/")
}

class RabbitMQClient:
    _instance = None
    _declared_exchanges = set()
    _declared_queues = {}

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(RabbitMQClient, cls).__new__(cls)
        return cls._instance

    def __init__(self, config=None):
        if not hasattr(self, 'initialized'):
            if config is None:
                config = DEFAULT_CONFIG
            self.config = config
            # If AMQP_ENABLED is True, attempt to connect; otherwise, activate mock mode.
            self.mock_enabled = not self.config.get("AMQP_ENABLED", False)
            self._connect()
            self.initialized = True

    def _connect(self):
        if not self.mock_enabled:
            try:
                credentials = pika.PlainCredentials(
                    self.config.get("RABBITMQ_DEFAULT_USER", "guest"),
                    self.config.get("RABBITMQ_DEFAULT_PASS", "guest")
                )
                parameters = pika.ConnectionParameters(
                    host=self.config.get("RABBITMQ_HOST", "localhost"),
                    port=int(self.config.get("RABBITMQ_PORT", 5672)),
                    virtual_host=self.config.get("RABBITMQ_VHOST", "/"),
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
            print("Mock mode activated. RabbitMQ will not be used.")

    def _ensure_connection(self):
        if (self.connection is None or self.channel is None or
            self.connection.is_closed or self.channel.is_closed):
            print("Reconnecting to RabbitMQ...")
            self._connect()

    def declare_exchange(self, exchange):
        self._ensure_connection()
        if exchange not in self._declared_exchanges:
            self.channel.exchange_declare(exchange=exchange, exchange_type="direct", durable=True)
            self._declared_exchanges.add(exchange)
            print(f"Exchange '{exchange}' created.")

    def declare_queue(self, queue_name, exchange, routing_key, ttl=None):
        self._ensure_connection()
        if queue_name not in self._declared_queues:
            arguments = {"x-message-ttl": ttl} if ttl else {}
            self.channel.queue_declare(queue=queue_name, durable=True, arguments=arguments)
            self.channel.queue_bind(exchange=exchange, queue=queue_name, routing_key=routing_key)
            self._declared_queues[queue_name] = True
            print(f"Queue '{queue_name}' declared with TTL={ttl}ms and bound to exchange '{exchange}'.")

    def publish(self, exchange, routing_key, message, event_id=None, ttl=None):
        self._ensure_connection()
        event_id = event_id or str(uuid.uuid4())

        if self.mock_enabled:
            print(f"[MOCK] Publishing message to exchange '{exchange}' with routing key '{routing_key}': {json.dumps(message)}")
        elif self.connection and self.connection.is_open and self.channel:
            try:
                self.declare_exchange(exchange)
                message_payload = {
                    "task": routing_key,
                    "id": event_id,
                    "args": [message],
                    "kwargs": {},
                }
                properties = pika.BasicProperties(
                    delivery_mode=2,
                    content_type="application/json",
                    expiration=str(ttl) if ttl else None
                )
                self.channel.basic_publish(
                    exchange=exchange,
                    routing_key=routing_key,
                    body=json.dumps(message_payload),
                    properties=properties
                )
                print(f"Message sent to exchange '{exchange}' with routing key '{routing_key}' (TTL={ttl}ms): {message_payload}")
            except pika.exceptions.AMQPError as e:
                print(f"Error sending message to RabbitMQ: {e}")

    def close(self):
        if not self.mock_enabled and self.connection and self.connection.is_open:
            self.connection.close()
            print("RabbitMQ connection closed.")
