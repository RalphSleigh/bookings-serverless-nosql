import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

export type ConfigType = {
  APPLE_CLIENT_ID: string,
  APPLE_CLIENT_SECRET: string,
  APPLE_KEY_ID: string,
  APPLE_TEAM_ID: string,
  BASE_URL: string,
  COOKIE_EXPIRY: number,
  DISCORD_ENABLED: boolean,
  DISCORD_BOT_TOKEN: string,
  DISCORD_GUILD_ID: string,
  DISCORD_CHANNEL_ID: string,
  DRIVE_SYNC_ENABLED: boolean,
  EMAIL_ENABLED: boolean,
  EMAIL_FROM: string,
  EMAIL_CLIENT_EMAIL: string,
  EMAIL_PRIVATE_KEY: string,
  ENV: string,
  FACEBOOK_CLIENT_ID: string,
  FACEBOOK_CLIENT_SECRET: string,
  GOOGLE_CLIENT_ID: string,
  GOOGLE_CLIENT_SECRET: string,
  JWT_SECRET: string,
  MICROSOFT_CLIENT_ID: string,
  MICROSOFT_CLIENT_SECRET: string,
  YAHOO_CLIENT_ID: string,
  YAHOO_CLIENT_SECRET: string,
}

let configData: ConfigType

export async function get_config(): Promise<ConfigType> {
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
            configData = unmarshall(data.Item!) as ConfigType
            }
            return configData
        } catch (error) {
            console.log(error)
            throw error
        } finally {
            // finally.
        }
}