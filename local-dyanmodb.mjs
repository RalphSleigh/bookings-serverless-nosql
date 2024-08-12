import { DynamoDBClient, CreateTableCommand, ResourceInUseException, PutItemCommand } from "@aws-sdk/client-dynamodb"
import fs from 'fs'

const dynamodbClientOptions = { region: 'eu-west-2', endpoint: 'http://localhost:8000' }
const client = new DynamoDBClient(dynamodbClientOptions)

try {
    const configTable = await client.send(new CreateTableCommand({
        TableName: 'Config',
        AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'key', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'key', KeyType: 'RANGE' }
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    }))
} catch (e) {
    if (!(e instanceof ResourceInUseException)) console.log(e)
}

try {
    const bookinsgTable = await client.send(new CreateTableCommand({
        TableName: 'Bookings',
        AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'sk', AttributeType: 'S' },
            { AttributeName: 'userIdVersion', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' }
        ],
        LocalSecondaryIndexes: [
            {
                IndexName: 'ls1',
                KeySchema: [
                    { AttributeName: 'pk', KeyType: 'HASH' },
                    { AttributeName: 'userIdVersion', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    }))
} catch (e) {
    if (!(e instanceof ResourceInUseException)) console.log(e)
    }

const configJson = JSON.parse(fs.readFileSync('config.json', 'utf8'))

await client.send(new PutItemCommand({
    TableName: 'Config',
    Item: configJson
}))