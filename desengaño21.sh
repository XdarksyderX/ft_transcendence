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

# Add the number to usernames if provided
for USERNAME in "${USERNAMES[@]}"; do
    MODIFIED_USERNAME="${USERNAME}${NUMBER_SUFFIX}"
    MODIFIED_USERNAMES+=("$MODIFIED_USERNAME")
done

for USERNAME in "${MODIFIED_USERNAMES[@]}"; do
    EMAIL=$(echo "${USERNAME}@paco.com" | tr '[:upper:]' '[:lower:]')  # Convert to lowercase
    curl -s -X POST http://localhost:5050/register \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${EMAIL}\",
        \"username\": \"${USERNAME}\",
        \"password\": \"${PASSWORD}\"
    }" > /dev/null
    check_success $? "Registro de usuario ${USERNAME}"

    JWT=$(curl -s -X POST http://localhost:5050/login \
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

for ((i=0; i<${#MODIFIED_USERNAMES[@]}; i++)); do
    for ((j=i+1; j<${#MODIFIED_USERNAMES[@]}; j++)); do
        curl -s -X POST "http://localhost:5051/requests/send/${MODIFIED_USERNAMES[j]}/" \
        -H "Cookie: access_token=${USER_JWT[i]}" > /dev/null
        check_success $? "Envío de solicitud de amistad de ${MODIFIED_USERNAMES[i]} a ${MODIFIED_USERNAMES[j]}"

        REQUEST_ID=$(curl -s -X GET "http://localhost:5051/requests/pending/received/" \
        -H "Cookie: access_token=${USER_JWT[j]}" | jq -r '.incoming[0].id')

        if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" == "null" ]; then
            echo "❌ No se encontró ninguna solicitud de amistad recibida por ${MODIFIED_USERNAMES[j]}"
            exit 1
        fi

        curl -s -X POST "http://localhost:5051/requests/accept/${REQUEST_ID}/" \
        -H "Cookie: access_token=${USER_JWT[j]}" > /dev/null
        check_success $? "Aceptación de solicitud de amistad de ${MODIFIED_USERNAMES[j]} a ${MODIFIED_USERNAMES[i]}"
    done
done

echo "✅ All users are now friends!"