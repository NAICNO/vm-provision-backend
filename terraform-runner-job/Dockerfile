# Use the latest version of Terraform
FROM --platform=linux/amd64 hashicorp/terraform:1.13.4

# Install Python and pip
RUN apk add --update python3 py3-pip

# Create a virtual environment and activate it
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Install pika for RabbitMQ
RUN pip3 install pika

# Copy the Python script into the container
COPY send_to_rabbitmq.py /send_to_rabbitmq.py
