import {Dynamo} from 'dynamodb-onetable/Dynamo'
import {Table, Entity} from 'dynamodb-onetable'
import {DynamoDBClient} from '@aws-sdk/client-dynamodb'

const client = new Dynamo({client: new DynamoDBClient({})})

const schema = {
    format: 'onetable:1.1.0',
    version: '0.0.1',
    indexes: {
        primary: {hash: 'pk', sort: 'sk'}
    },
    models: {
        User: {
            pk: {type: String, value: 'user:${userName}'},
            sk: {type: String, value: 'user'},
            remoteId: {type: String},
            userName: {type: String, required: true},
            password: {type: String},
            email: {type: String},
            source: { type: String}
        } as const,
    },    
    params: {
        isoDates: true,
        timestamps: true,
    },
}

export type UserType = Entity<typeof schema.models.User>

export const table = new Table({
    client: client,
    name: 'Bookings',
    schema: schema,
})

