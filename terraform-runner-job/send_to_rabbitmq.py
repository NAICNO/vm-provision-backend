import json
import pika
import sys
import os
import json

rabbitmq_username = os.getenv('RABBITMQ_USER')
rabbitmq_password = os.getenv('RABBITMQ_PASSWORD')
vm_id = os.getenv('VM_ID')
action = os.getenv('ACTION')
rabbitmq_host = 'rabbitmq'
queue_name = 'vm_provisioning_progress'

# Set up the connection to RabbitMQ
credentials = pika.PlainCredentials(rabbitmq_username, rabbitmq_password)
parameters = pika.ConnectionParameters(rabbitmq_host, 5672, '/', credentials)
connection = pika.BlockingConnection(parameters)

channel = connection.channel()

# Ensure the queue exists
channel.queue_declare(queue=queue_name, durable=True)

# Function to publish a message to RabbitMQ
def publish_message(message):
    channel.basic_publish(
        exchange='',  # Default exchange
        routing_key=queue_name,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
        )
    )

# Read from stdin and publish each line as a message
for line in sys.stdin:
    trimmed_line = line.strip()
    message_dict = json.loads(trimmed_line)
    message = {
        'vm_id': vm_id,
        'action': action,
        'message': message_dict
    }
    json_message = json.dumps(message)
    publish_message(json_message)

# Close the connection
connection.close()
