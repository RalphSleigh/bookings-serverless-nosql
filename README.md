# bookings-serverless-nosql

Beep

# Local Development in VSCode:

1. npm install
2. generate ./cert/cert.key and ./cert/cert.pem for localhost or whatever domain
3. docker-compose up
4. copy config-example.json to config.json and fill in
5. node local-dynamodb.mjs
6. node esbuild-front-local.mjs
7. node esbuild-local.mjs
8. Launch Program
9. Go to /api/seed to generate test data, this will take a couple of minutes.