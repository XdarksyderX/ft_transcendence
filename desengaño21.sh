#!/bin/bash

set -e  # Hace que el script falle en cualquier error no controlado

# Check if a number was passed as parameter
NUMBER_SUFFIX=""
if [ $# -gt 0 ]; then
    NUMBER_SUFFIX="$1"
fi

check_success() {
    if [ "$1" -ne 0 ]; then
        echo "❌ Error en la petición: $2"
        exit 1
    fi
}

USERNAMES=("Vicenta" "Marisa" "Concha" "Paloma" "Isabel" "JuanCuesta" "Emilio" "Belen")
MODIFIED_USERNAMES=()
PASSWORD="12345678"
USER_JWT=()

# Añadir el sufijo a los nombres de usuario si se proporcionó
for USERNAME in "${USERNAMES[@]}"; do
    MODIFIED_USERNAME="${USERNAME}${NUMBER_SUFFIX}"
    MODIFIED_USERNAMES+=("$MODIFIED_USERNAME")
done

# Registrar usuarios y obtener sus tokens JWT
for USERNAME in "${MODIFIED_USERNAMES[@]}"; do
    EMAIL=$(echo "${USERNAME}@paco.com" | tr '[:upper:]' '[:lower:]')  # Convertir a minúsculas
    curl -k -s -X POST https://localhost:5090/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${EMAIL}\",
        \"username\": \"${USERNAME}\",
        \"password\": \"${PASSWORD}\"
    }" > /dev/null
    check_success $? "Registro de usuario ${USERNAME}"

    JWT=$(curl -k -s -X POST https://localhost:5090/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"${USERNAME}\", \"password\": \"${PASSWORD}\"}" | jq -r '.access_token')

    if [ "$JWT" == "null" ] || [ -z "$JWT" ]; then
        echo "❌ Error al obtener token de ${USERNAME}"
        exit 1
    fi

    USER_JWT+=("$JWT")
done

echo "Users created: ${MODIFIED_USERNAMES[*]}"
echo "Password: ${PASSWORD}"

echo "Making friends..."
sleep 3

# Realizar solicitudes y aceptar amistades entre todos los pares
for ((i=0; i<${#MODIFIED_USERNAMES[@]}; i++)); do
    for ((j=i+1; j<${#MODIFIED_USERNAMES[@]}; j++)); do
        # Enviar solicitud de amistad de MODIFIED_USERNAMES[i] a MODIFIED_USERNAMES[j]
        curl -k -s -X POST "https://localhost:5090/api/social/requests/send/${MODIFIED_USERNAMES[j]}/" \
        -H "Cookie: access_token=${USER_JWT[i]}" > /dev/null
        check_success $? "Envío de solicitud de amistad de ${MODIFIED_USERNAMES[i]} a ${MODIFIED_USERNAMES[j]}"

        # Obtener el ID de la solicitud pendiente recibida para MODIFIED_USERNAMES[j]
        REQUEST_ID=$(curl -k -s -X GET "https://localhost:5090/api/social/requests/pending/received/" \
        -H "Cookie: access_token=${USER_JWT[j]}" | jq -r '.incoming[0].id')

        if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" == "null" ]; then
            echo "❌ No se encontró ninguna solicitud de amistad recibida por ${MODIFIED_USERNAMES[j]}"
            exit 1
        fi

        # Aceptar la solicitud de amistad
        curl -k -s -X POST "https://localhost:5090/api/social/requests/accept/${REQUEST_ID}/" \
        -H "Cookie: access_token=${USER_JWT[j]}" > /dev/null
        check_success $? "Aceptación de solicitud de amistad de ${MODIFIED_USERNAMES[j]} a ${MODIFIED_USERNAMES[i]}"
    done
done

echo "✅ All users are now friends!"
