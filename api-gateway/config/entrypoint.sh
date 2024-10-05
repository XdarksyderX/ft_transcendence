#!/bin/bash

# Define the certificate paths
CERT_DIR="/etc/nginx"
CERT_KEY="$CERT_DIR/selfsigned.key"
CERT_CRT="$CERT_DIR/selfsigned.crt"

# Check if the certificates already exist, if not, create them
if [ ! -f "$CERT_KEY" ] || [ ! -f "$CERT_CRT" ]; then
    echo "Generating self-signed certificates..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$CERT_KEY" -out "$CERT_CRT" -subj "/C=ES/ST=Andalucia/L=Malaga/O=ft_transcendence/OU=IT/CN=localhost"
    echo "Certificates created at $CERT_DIR"
else
    echo "Certificates already exist, skipping generation."
fi

# Start Nginx
echo "Starting Nginx..."
nginx -g "daemon off;"
