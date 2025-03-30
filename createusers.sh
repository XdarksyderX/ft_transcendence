#!/bin/bash

set -e  # Hace que el script falle en cualquier error no controlado

check_success() {
	if [ "$1" -ne 0 ]; then
		echo "❌ Error en la petición: $2"
		exit 1
	fi
}

FIRSTUSERNAME="pepe${RANDOM}"

curl -k -s -X POST https://localhost:5090/api/auth/register \
-H "Content-Type: application/json" \
-d "{
	\"email\": \"${FIRSTUSERNAME}@paco.com\",
	\"username\": \"${FIRSTUSERNAME}\",
	\"password\": \"12345678\"
}" > /dev/null
check_success $? "Registro de primer usuario"

SECONDUSERNAME="paco${RANDOM}"

curl -k -s -X POST https://localhost:5090/api/auth/register \
-H "Content-Type: application/json" \
-d "{
	\"email\": \"${SECONDUSERNAME}@paco.com\",
	\"username\": \"${SECONDUSERNAME}\",
	\"password\": \"12345678\"
}" > /dev/null
check_success $? "Registro de segundo usuario"

echo "Users created: ${FIRSTUSERNAME} and ${SECONDUSERNAME}"
echo "Password: 12345678"

FIRSTUSER_JWT=$(curl -k -s -X POST https://localhost:5090/api/auth/login \
-H "Content-Type: application/json" \
-d "{\"username\": \"${FIRSTUSERNAME}\", \"password\": \"12345678\"}" | jq -r '.access_token')

if [ "$FIRSTUSER_JWT" == "null" ] || [ -z "$FIRSTUSER_JWT" ]; then
	echo "❌ Error al obtener token de ${FIRSTUSERNAME}"
	exit 1
fi

SECONDUSER_JWT=$(curl -k -s -X POST https://localhost:5090/api/auth/login \
-H "Content-Type: application/json" \
-d "{\"username\": \"${SECONDUSERNAME}\", \"password\": \"12345678\"}" | jq -r '.access_token')

if [ "$SECONDUSER_JWT" == "null" ] || [ -z "$SECONDUSER_JWT" ]; then
	echo "❌ Error al obtener token de ${SECONDUSERNAME}"
	exit 1
fi

echo "Making friends..."
sleep 3

# Enviar solicitud de amistad usando el servicio social
curl -k -s -X POST "https://localhost:5090/api/social/requests/send/${SECONDUSERNAME}/" \
-H "Cookie: access_token=${FIRSTUSER_JWT}" > /dev/null
check_success $? "Envío de solicitud de amistad"

REQUEST_ID=$(curl -k -s -X GET "https://localhost:5090/api/social/requests/pending/received/" \
-H "Cookie: access_token=${SECONDUSER_JWT}" | jq -r '.incoming[0].id')

if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" == "null" ]; then
	echo "❌ No se encontró ninguna solicitud de amistad recibida por ${SECONDUSERNAME}"
	exit 1
fi

curl -k -s -X POST "https://localhost:5090/api/social/requests/accept/${REQUEST_ID}/" \
-H "Cookie: access_token=${SECONDUSER_JWT}" > /dev/null
check_success $? "Aceptación de solicitud de amistad"

echo "✅ Friends made!"
