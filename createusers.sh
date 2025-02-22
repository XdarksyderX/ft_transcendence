FIRSTUSERNAME="pepe${RANDOM}"

curl -s -X POST http://localhost:5050/register \
-H "Content-Type: application/json" \
-d "{
	\"email\": \"${FIRSTUSERNAME}@paco.com\",
	\"username\": \"${FIRSTUSERNAME}\",
	\"password\": \"12345678\"
}" > /dev/null

SECONDUSERNAME="paco${RANDOM}"

curl -s -X POST http://localhost:5050/register \
-H "Content-Type: application/json" \
-d "{
	\"email\": \"${SECONDUSERNAME}@paco.com\",
	\"username\": \"${SECONDUSERNAME}\",
	\"password\": \"12345678\"
}" > /dev/null

echo "Users created: ${FIRSTUSERNAME} and ${SECONDUSERNAME}"
echo "Password: 12345678"

FIRSTUSER_JWT=$(curl -s -X POST http://localhost:5050/login \
-H "Content-Type: application/json" \
-d "{\"username\": \"${FIRSTUSERNAME}\", \"password\": \"12345678\"}" | jq -r '.access_token')


SECONDUSER_JWT=$(curl -s -X POST http://localhost:5050/login \
-H "Content-Type: application/json" \
-d "{\"username\": \"${SECONDUSERNAME}\", \"password\": \"12345678\"}" | jq -r '.access_token')

echo "Making friends..."
sleep 3

curl -s -X POST "http://localhost:5051/requests/send/${SECONDUSERNAME}/" \
-H "Cookie: access_token=${FIRSTUSER_JWT}" > /dev/null

curl -s -X GET "http://localhost:5051/requests/pending/received/" \
-H "Cookie: access_token=${SECONDUSER_JWT}" | jq -r '.incoming[0].id' | xargs -I {} curl -s -X POST "http://localhost:5051/requests/accept/{}/" -H "Cookie: access_token=${SECONDUSER_JWT}" > /dev/null

echo "Friends made!"
