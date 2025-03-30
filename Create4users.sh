#!/bin/bash

set -e  # Hace que el script falle en cualquier error no controlado

# Función para comprobar el éxito de un comando
check_success() {
    if [ "$1" -ne 0 ]; then
        echo "❌ Error en la petición: $2"
        exit 1
    fi
}

# Función para hacer amigos a dos usuarios
make_friends() {
    local sender_jwt=$1
    local receiver_username=$2
    local receiver_jwt=$3

    # Enviar solicitud de amistad
    curl -k -s -X POST "https://localhost:5090/api/social/requests/send/${receiver_username}/" \
         -H "Cookie: access_token=${sender_jwt}" > /dev/null
    check_success $? "Envío de solicitud de amistad"

    # Obtener el ID de la solicitud pendiente recibida
    REQUEST_ID=$(curl -k -s -X GET "https://localhost:5090/api/social/requests/pending/received/" \
         -H "Cookie: access_token=${receiver_jwt}" | jq -r '.incoming[0].id')

    if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" == "null" ]; then
        echo "❌ No se encontró ninguna solicitud de amistad recibida por ${receiver_username}"
        exit 1
    fi

    # Aceptar la solicitud de amistad
    curl -k -s -X POST "https://localhost:5090/api/social/requests/accept/${REQUEST_ID}/" \
         -H "Cookie: access_token=${receiver_jwt}" > /dev/null
    check_success $? "Aceptación de solicitud de amistad"
}

# Definir nombres de usuario
USER1="pepe${RANDOM}"
USER2="paco${RANDOM}"
USER3="three${RANDOM}"
USER4="four${RANDOM}"

# Registrar usuarios
curl -k -s -X POST https://localhost:5090/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{
         \"email\": \"${USER1}@paco.com\",
         \"username\": \"${USER1}\",
         \"password\": \"12345678\"
     }" > /dev/null
check_success $? "Registro de primer usuario"

curl -k -s -X POST https://localhost:5090/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{
         \"email\": \"${USER2}@paco.com\",
         \"username\": \"${USER2}\",
         \"password\": \"12345678\"
     }" > /dev/null
check_success $? "Registro de segundo usuario"

curl -k -s -X POST https://localhost:5090/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{
         \"email\": \"${USER3}@paco.com\",
         \"username\": \"${USER3}\",
         \"password\": \"12345678\"
     }" > /dev/null
check_success $? "Registro de tercer usuario"

curl -k -s -X POST https://localhost:5090/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{
         \"email\": \"${USER4}@paco.com\",
         \"username\": \"${USER4}\",
         \"password\": \"12345678\"
     }" > /dev/null
check_success $? "Registro de cuarto usuario"

echo "Users created: ${USER1}, ${USER2}, ${USER3}, ${USER4}"
echo "Password: 12345678"

# Iniciar sesión y obtener JWT para cada usuario
USER1_JWT=$(curl -k -s -X POST https://localhost:5090/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"${USER1}\", \"password\": \"12345678\"}" | jq -r '.access_token')
if [ "$USER1_JWT" == "null" ] || [ -z "$USER1_JWT" ]; then
    echo "❌ Error al obtener token de ${USER1}"
    exit 1
fi

USER2_JWT=$(curl -k -s -X POST https://localhost:5090/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"${USER2}\", \"password\": \"12345678\"}" | jq -r '.access_token')
if [ "$USER2_JWT" == "null" ] || [ -z "$USER2_JWT" ]; then
    echo "❌ Error al obtener token de ${USER2}"
    exit 1
fi

USER3_JWT=$(curl -k -s -X POST https://localhost:5090/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"${USER3}\", \"password\": \"12345678\"}" | jq -r '.access_token')
if [ "$USER3_JWT" == "null" ] || [ -z "$USER3_JWT" ]; then
    echo "❌ Error al obtener token de ${USER3}"
    exit 1
fi

USER4_JWT=$(curl -k -s -X POST https://localhost:5090/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"${USER4}\", \"password\": \"12345678\"}" | jq -r '.access_token')
if [ "$USER4_JWT" == "null" ] || [ -z "$USER4_JWT" ]; then
    echo "❌ Error al obtener token de ${USER4}"
    exit 1
fi

echo "Making friends..."
sleep 3

# Establecer amistad entre todos los pares
make_friends "$USER1_JWT" "$USER2" "$USER2_JWT"  # USER1 -> USER2
make_friends "$USER1_JWT" "$USER3" "$USER3_JWT"  # USER1 -> USER3
make_friends "$USER1_JWT" "$USER4" "$USER4_JWT"  # USER1 -> USER4
make_friends "$USER2_JWT" "$USER3" "$USER3_JWT"  # USER2 -> USER3
make_friends "$USER2_JWT" "$USER4" "$USER4_JWT"  # USER2 -> USER4
make_friends "$USER3_JWT" "$USER4" "$USER4_JWT"  # USER3 -> USER4

echo "✅ All friends made!"
