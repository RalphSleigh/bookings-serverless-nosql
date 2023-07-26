import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

let configData: any = null

export async function get_config() {
        try {
            if(!configData) {
            const client = new DynamoDBClient({
                region: 'eu-west-2',
            })

            const input = {
                "Key": {
                  "pk": {
                    "S": "CONFIG"
                  },
                  "key": {
                    "S": "CURRENT"
                  }
                },
                "TableName": "Config"
              };

            const command = new GetItemCommand(input)
            const data = await client.send(command)
            configData = unmarshall(data.Item!)
            }
            return configData
        } catch (error) {
            console.log(error)
            // error handling.
        } finally {
            // finally.
        }
}