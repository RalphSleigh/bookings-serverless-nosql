import  fetch from 'node-fetch'
import am_in_lambda from './am_in_lambda.js'
import { DynamoDBClient, ScanCommand  } from '@aws-sdk/client-dynamodb'

export async function get_config() {
    if(!am_in_lambda()) {

        const client = new DynamoDBClient({
            region: 'eu-west-2',
        })

        try {
            const command = new ScanCommand({TableName: 'Config'})
            const data = await client.send(command)
            return data
          } catch (error) {
            // error handling.
          } finally {
            // finally.
          }
    
    } else {
        const config = '../../config.js'
        return (await import(config)).default
    }
}