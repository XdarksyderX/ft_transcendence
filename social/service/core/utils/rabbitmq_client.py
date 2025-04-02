import os
import json
import uuid
import time
import logging
from functools import wraps
import pika

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RabbitMQClient")

DEFAULT_CONFIG = {
    "AMQP_ENABLED": os.getenv("AMQP_ENABLED", "false").lower() == "true",
    "RABBITMQ_DEFAULT_USER": os.getenv("RABBITMQ_DEFAULT_USER", "guest"),
    "RABBITMQ_DEFAULT_PASS": os.getenv("RABBITMQ_DEFAULT_PASS", "guest"),
    "RABBITMQ_HOST": os.getenv("RABBITMQ_HOST", "localhost"),
    "RABBITMQ_PORT": int(os.getenv("RABBITMQ_PORT", 5672)),
    "RABBITMQ_VHOST": os.getenv("RABBITMQ_VHOST", "/"),
    "RABBITMQ_RETRY_MAX_ATTEMPTS": int(os.getenv("RABBITMQ_RETRY_MAX_ATTEMPTS", 5)),
    "RABBITMQ_RETRY_INITIAL_DELAY": float(os.getenv("RABBITMQ_RETRY_INITIAL_DELAY", 1.0)),
    "RABBITMQ_RETRY_BACKOFF_FACTOR": float(os.getenv("RABBITMQ_RETRY_BACKOFF_FACTOR", 2.0)),
    "RABBITMQ_RETRY_MAX_DELAY": float(os.getenv("RABBITMQ_RETRY_MAX_DELAY", 30.0)),
    "RABBITMQ_HEARTBEAT": int(os.getenv("RABBITMQ_HEARTBEAT", 60)),
}

def retry_operation(operation_name):
    """
    Decorator for methods that need retry logic
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if self.mock_enabled:
                return func(self, *args, **kwargs)
            
            max_attempts = self.config.get("RABBITMQ_RETRY_MAX_ATTEMPTS", 5)
            initial_delay = self.config.get("RABBITMQ_RETRY_INITIAL_DELAY", 1.0)
            backoff_factor = self.config.get("RABBITMQ_RETRY_BACKOFF_FACTOR", 2.0)
            max_delay = self.config.get("RABBITMQ_RETRY_MAX_DELAY", 30.0)
            attempt = 0
            last_exception = None

            while attempt < max_attempts:
                try:
                    self._ensure_connection()
                    return func(self, *args, **kwargs)
                except (pika.exceptions.AMQPConnectionError, 
                        pika.exceptions.AMQPChannelError,
                        ConnectionError) as e:
                    attempt += 1
                    last_exception = e
                    if attempt >= max_attempts:
                        logger.error(f"Failed {operation_name} after {max_attempts} attempts: {e}")
                        break
                    
                    # Calculate exponential backoff with jitter
                    delay = min(initial_delay * (backoff_factor ** (attempt - 1)), max_delay)
                    jitter = delay * 0.1  # 10% jitter
                    delay = delay + (jitter * (2 * (uuid.uuid4().int % 100) / 100 - 1))
                    
                    logger.warning(f"{operation_name} failed (attempt {attempt}/{max_attempts}): {e}. "
                                  f"Retrying in {delay:.2f} seconds...")
                    time.sleep(delay)
            
            # If we get here, all retries have failed
            if last_exception:
                raise last_exception
        return wrapper
    return decorator

class RabbitMQClient:
    """
    Singleton implementation of RabbitMQ client with robust queue declaration handling.
    
    Features:
    - Singleton pattern ensures only one client instance exists
    - Handles queue declaration conflicts gracefully
    - Robust reconnection and retry logic
    - Support for dead letter exchanges and message retries
    - Tracking of declared resources to prevent redundant operations
    """
    _instance = None
    _declared_exchanges = set()
    _declared_queues = {}
    _queue_properties = {}  # Store queue properties for conflict resolution

    def __new__(cls, *args, **kwargs):
        """Singleton implementation - ensures only one instance exists"""
        if cls._instance is None:
            cls._instance = super(RabbitMQClient, cls).__new__(cls)
        return cls._instance

    def __init__(self, config=None):
        """Initialize the RabbitMQ client (only runs once)"""
        if not hasattr(self, 'initialized'):
            # Configuration
            if config is None:
                config = DEFAULT_CONFIG
            self.config = config
            self.mock_enabled = not self.config.get("AMQP_ENABLED", False)
            
            # For storing messages that couldn't be sent
            self.pending_messages = []
            
            # Message tracking
            self.sent_message_ids = set()
            self.max_tracked_messages = 10000  # Limit the size of tracking set
            
            # Connection
            self._connect()
            self.initialized = True

    def _connect(self):
        """Establish connection to RabbitMQ server"""
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
                    credentials=credentials,
                    heartbeat=self.config.get("RABBITMQ_HEARTBEAT", 60),
                    blocked_connection_timeout=300,
                    connection_attempts=3,
                    retry_delay=5
                )
                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()
                logger.info("Connected to RabbitMQ")
                
                # Process any pending messages
                self._process_pending_messages()
            except pika.exceptions.AMQPConnectionError as e:
                logger.error(f"Error connecting to RabbitMQ: {e}")
                self.connection = None
                self.channel = None
        else:
            self.connection = None
            self.channel = None
            logger.info("Mock mode activated. RabbitMQ will not be used.")

    def _ensure_connection(self):
        """Ensure connection is active, reconnect if needed"""
        if self.mock_enabled:
            return
            
        if (self.connection is None or self.channel is None or
            self.connection.is_closed or (hasattr(self.channel, 'is_closed') and self.channel.is_closed)):
            logger.info("Reconnecting to RabbitMQ...")
            self._connect()
            
        if self.connection is None or self.channel is None:
            raise ConnectionError("Failed to establish connection to RabbitMQ")

    @retry_operation("Exchange declaration")
    def declare_exchange(self, exchange):
        """Declare an exchange if it doesn't exist already"""
        if exchange not in self._declared_exchanges:
            self.channel.exchange_declare(exchange=exchange, exchange_type="direct", durable=True)
            self._declared_exchanges.add(exchange)
            logger.info(f"Exchange '{exchange}' created")

    @retry_operation("Queue declaration")
    def declare_queue(self, queue_name, exchange, routing_key, ttl=None, dead_letter_exchange=None):
        """
        Declare a queue with robust handling of pre-existing queues with different properties.
        
        Handles PRECONDITION_FAILED errors when a queue already exists with different properties.
        """
        try:
            # Prepare queue arguments
            arguments = {}
            if ttl:
                arguments["x-message-ttl"] = ttl
            if dead_letter_exchange:
                arguments["x-dead-letter-exchange"] = dead_letter_exchange
                arguments["x-dead-letter-routing-key"] = routing_key
                
            # Store the desired queue properties
            self._queue_properties[queue_name] = arguments
                
            # Check if already declared with the same properties
            if queue_name in self._declared_queues:
                logger.info(f"Queue '{queue_name}' already declared")
                return
                
            # Attempt to declare the queue
            result = self.channel.queue_declare(
                queue=queue_name, 
                durable=True, 
                arguments=arguments
            )
            
            # Bind the queue to the exchange
            self.channel.queue_bind(
                exchange=exchange, 
                queue=queue_name, 
                routing_key=routing_key
            )
            
            # Mark as declared
            self._declared_queues[queue_name] = True
            logger.info(f"Queue '{queue_name}' declared and bound to exchange '{exchange}'")
            
        except pika.exceptions.ChannelClosedByBroker as e:
            # Handle case where queue exists with different properties
            if "PRECONDITION_FAILED" in str(e):
                logger.warning(f"Queue '{queue_name}' exists with different properties: {e}")
                
                # Reconnect since the channel was closed
                self._ensure_connection()
                
                # Try to bind the existing queue
                try:
                    self.channel.queue_bind(
                        exchange=exchange, 
                        queue=queue_name, 
                        routing_key=routing_key
                    )
                    logger.info(f"Using existing queue '{queue_name}' with different properties")
                    self._declared_queues[queue_name] = True
                except Exception as bind_error:
                    logger.error(f"Failed to bind existing queue '{queue_name}': {bind_error}")
                    raise
            else:
                logger.error(f"Unexpected error declaring queue '{queue_name}': {e}")
                raise

    def setup_retry_infrastructure(self, exchange, routing_key, retry_queue_name=None, 
                                  final_queue_name=None, max_retries=3, retry_delay=30000):
        """
        Set up the necessary infrastructure for message retries.
        
        Args:
            exchange: The main exchange
            routing_key: The routing key for the main queue
            retry_queue_name: Name for the retry queue (default: {routing_key}.retry)
            final_queue_name: Name for the main queue (default: {routing_key})
            max_retries: Maximum number of retry attempts
            retry_delay: Delay between retries in milliseconds
        """
        if self.mock_enabled:
            logger.info("[MOCK] Setting up retry infrastructure")
            return
            
        self._ensure_connection()
        
        # Define queue names if not provided
        if not retry_queue_name:
            retry_queue_name = f"{routing_key}.retry"
        if not final_queue_name:
            final_queue_name = routing_key
            
        # Declare the main exchange
        self.declare_exchange(exchange)
        
        # Declare a dead letter exchange for failed messages
        dead_letter_exchange = f"{exchange}.dlx"
        self.declare_exchange(dead_letter_exchange)
        
        # Declare the main queue with dead letter configuration
        self.declare_queue(
            queue_name=final_queue_name,
            exchange=exchange,
            routing_key=routing_key,
            dead_letter_exchange=dead_letter_exchange
        )
        
        # Declare the retry queue with TTL and binding back to the main exchange
        self.declare_queue(
            queue_name=retry_queue_name,
            exchange=dead_letter_exchange,
            routing_key=routing_key,
            ttl=retry_delay,
            dead_letter_exchange=exchange
        )
        
        logger.info(f"Retry infrastructure set up for exchange '{exchange}' with routing key '{routing_key}'")
        return final_queue_name, retry_queue_name

    @retry_operation("Message publishing")
    def publish(self, exchange, routing_key, message, event_id=None, ttl=None, retry_count=0, max_retries=None):
        """
        Publish a message to RabbitMQ with retry capabilities.
        
        Args:
            exchange: The exchange to publish to
            routing_key: The routing key for message delivery
            message: The message content (will be JSON serialized)
            event_id: Unique ID for the message (generated if not provided)
            ttl: Time-to-live for the message in milliseconds
            retry_count: Current retry count (used internally)
            max_retries: Maximum number of retries (uses config if not specified)
        """
        if max_retries is None:
            max_retries = self.config.get("RABBITMQ_RETRY_MAX_ATTEMPTS", 5)
            
        # Generate or use provided event_id
        event_id = event_id or str(uuid.uuid4())
        
        # Check if this message has already been sent successfully
        if event_id in self.sent_message_ids:
            logger.info(f"Message with ID {event_id} already sent, skipping")
            return
            
        if self.mock_enabled:
            logger.info(f"[MOCK] Publishing message to exchange '{exchange}' with routing key '{routing_key}': {json.dumps(message)}")
            self.sent_message_ids.add(event_id)
            self._maintain_tracking_set()
            return
            
        try:
            self._ensure_connection()
            self.declare_exchange(exchange)
            
            # Include retry information in message headers
            message_payload = {
                "task": routing_key,
                "id": event_id,
                "args": [message],
                "kwargs": {},
                "retry_count": retry_count
            }
            
            properties = pika.BasicProperties(
                delivery_mode=2,  # persistent
                content_type="application/json",
                message_id=event_id,
                expiration=str(ttl) if ttl else None,
                headers={"retry_count": retry_count, "max_retries": max_retries}
            )
            
            self.channel.basic_publish(
                exchange=exchange,
                routing_key=routing_key,
                body=json.dumps(message_payload),
                properties=properties
            )
            
            logger.info(f"Message {event_id} sent to exchange '{exchange}' with routing key '{routing_key}' "
                      f"(TTL={ttl}ms, retry={retry_count}/{max_retries})")
                      
            # Mark as sent
            self.sent_message_ids.add(event_id)
            self._maintain_tracking_set()
            return True
            
        except Exception as e:
            # If max retries reached, add to pending messages for future retry
            if retry_count >= max_retries:
                logger.error(f"Failed to publish message after {retry_count} attempts: {e}")
                self._queue_pending_message(exchange, routing_key, message, event_id, ttl, retry_count)
                return False
            else:
                # This error should be caught by the retry_operation decorator 
                # which will handle the retry logic
                raise

    def _queue_pending_message(self, exchange, routing_key, message, event_id, ttl, retry_count):
        """Store messages that couldn't be sent for later retry"""
        pending_message = {
            "exchange": exchange,
            "routing_key": routing_key,
            "message": message,
            "event_id": event_id,
            "ttl": ttl,
            "retry_count": retry_count,
            "timestamp": time.time()
        }
        self.pending_messages.append(pending_message)
        logger.info(f"Message {event_id} queued for later retry (pending: {len(self.pending_messages)})")

    def _process_pending_messages(self):
        """Attempt to resend any pending messages"""
        if not self.pending_messages:
            return
            
        logger.info(f"Processing {len(self.pending_messages)} pending messages")
        still_pending = []
        
        for msg in self.pending_messages:
            try:
                # Increment retry count
                new_retry_count = msg["retry_count"] + 1
                
                # Attempt to resend the message
                success = self.publish(
                    msg["exchange"], 
                    msg["routing_key"], 
                    msg["message"],
                    msg["event_id"], 
                    msg["ttl"],
                    new_retry_count
                )
                
                if not success:
                    still_pending.append(msg)
            except Exception as e:
                logger.error(f"Error processing pending message {msg['event_id']}: {e}")
                still_pending.append(msg)
                
        self.pending_messages = still_pending
        logger.info(f"{len(self.pending_messages)} messages still pending")

    def _maintain_tracking_set(self):
        """Limit the size of the sent_message_ids set to prevent memory leaks"""
        if len(self.sent_message_ids) > self.max_tracked_messages:
            # Convert to list, sort by time (if using timestamped UUIDs), and trim
            # This is a simplified approach - for production consider using an LRU cache
            excess = len(self.sent_message_ids) - self.max_tracked_messages
            self.sent_message_ids = set(list(self.sent_message_ids)[excess:])

    def consume_with_retry(self, queue, callback, auto_ack=False, prefetch_count=1):
        """
        Set up a consumer with automatic retry handling
        
        Args:
            queue: Queue to consume from
            callback: Function to process messages (should return True on success, False on failure)
            auto_ack: Whether to auto-acknowledge messages
            prefetch_count: How many messages to prefetch
        """
        if self.mock_enabled:
            logger.info(f"[MOCK] Setting up consumer for queue '{queue}'")
            return
            
        @retry_operation("Consumer setup")
        def setup_consumer():
            self._ensure_connection()
            
            # Set QoS prefetch count
            self.channel.basic_qos(prefetch_count=prefetch_count)
            
            # Define the wrapper callback that handles retries
            def on_message(ch, method, properties, body):
                try:
                    message = json.loads(body)
                    event_id = message.get("id", properties.message_id)
                    
                    # Extract retry information
                    headers = properties.headers or {}
                    retry_count = headers.get("retry_count", 0)
                    max_retries = headers.get("max_retries", self.config.get("RABBITMQ_RETRY_MAX_ATTEMPTS", 5))
                    
                    logger.info(f"Processing message {event_id} (retry {retry_count}/{max_retries})")
                    
                    # Process the message
                    success = callback(ch, method, properties, body)
                    
                    if success:
                        # Acknowledge the message if not using auto-ack
                        if not auto_ack:
                            ch.basic_ack(delivery_tag=method.delivery_tag)
                        logger.info(f"Successfully processed message {event_id}")
                    else:
                        # Failed to process, maybe retry
                        if retry_count >= max_retries:
                            logger.warning(f"Message {event_id} exceeded max retries, sending to dead letter")
                            # Reject and don't requeue - will go to DLQ if configured
                            if not auto_ack:
                                ch.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
                        else:
                            # Increment retry count and publish to retry queue if we have one
                            # Otherwise just nack and requeue
                            logger.info(f"Message {event_id} processing failed, scheduling retry {retry_count+1}/{max_retries}")
                            # For simplicity, just reject and requeue
                            # In a more advanced implementation, you might republish with a delay
                            if not auto_ack:
                                ch.basic_reject(delivery_tag=method.delivery_tag, requeue=True)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    # Don't requeue on parsing errors
                    if not auto_ack:
                        ch.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
            
            # Start consuming
            self.channel.basic_consume(queue=queue, on_message_callback=on_message, auto_ack=auto_ack)
            logger.info(f"Started consuming from queue '{queue}'")
            
            # Start the consume loop
            try:
                logger.info("Waiting for messages. To exit press CTRL+C")
                self.channel.start_consuming()
            except KeyboardInterrupt:
                logger.info("Consumer stopped by user")
                self.channel.stop_consuming()
                
        setup_consumer()

    def manual_retry(self, dead_letter_queue, target_exchange, routing_key, max_messages=10):
        """
        Manually move messages from a dead letter queue back to the target exchange.
        
        Args:
            dead_letter_queue: Queue to take messages from
            target_exchange: Exchange to publish to
            routing_key: Routing key for republishing
            max_messages: Maximum number of messages to process
        """
        if self.mock_enabled:
            logger.info(f"[MOCK] Manual retry from '{dead_letter_queue}' to '{target_exchange}'")
            return
            
        self._ensure_connection()
        
        for _ in range(max_messages):
            method, properties, body = self.channel.basic_get(queue=dead_letter_queue, auto_ack=False)
            
            if method is None:
                logger.info(f"No more messages in {dead_letter_queue}")
                break
                
            try:
                # Extract message and retry information
                message = json.loads(body)
                event_id = message.get("id", properties.message_id)
                headers = properties.headers or {}
                retry_count = headers.get("retry_count", 0) + 1
                
                # Republish with incremented retry count
                logger.info(f"Manually retrying message {event_id} (retry {retry_count})")
                
                new_properties = pika.BasicProperties(
                    delivery_mode=2,
                    content_type=properties.content_type,
                    message_id=properties.message_id,
                    expiration=properties.expiration,
                    headers={**headers, "retry_count": retry_count, "manually_retried": True}
                )
                
                self.channel.basic_publish(
                    exchange=target_exchange,
                    routing_key=routing_key,
                    body=body,
                    properties=new_properties
                )
                
                # Acknowledge the original message
                self.channel.basic_ack(delivery_tag=method.delivery_tag)
                logger.info(f"Message {event_id} manually retried")
            except Exception as e:
                logger.error(f"Error manually retrying message: {e}")
                # Requeue the message
                self.channel.basic_reject(delivery_tag=method.delivery_tag, requeue=True)

    def close(self):
        """Close the RabbitMQ connection"""
        if not self.mock_enabled and self.connection and self.connection.is_open:
            try:
                self.connection.close()
                logger.info("RabbitMQ connection closed")
            except Exception as e:
                logger.error(f"Error closing RabbitMQ connection: {e}")
