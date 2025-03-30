#!/bin/bash

CERT_DIR="gateway/config"
CERT_KEY="$CERT_DIR/selfsigned.key"
CERT_CRT="$CERT_DIR/selfsigned.crt"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_KEY" ] || [ ! -f "$CERT_CRT" ]; then
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$CERT_KEY" -out "$CERT_CRT" -subj "/C=ES/ST=Andalucia/L=Malaga/O=ft_transcendence/OU=IT/CN=ft_transcendence"
	echo "Certificates generated in $CERT_DIR directory"
else
	echo "Certificates already exist in $CERT_DIR directory"
fi