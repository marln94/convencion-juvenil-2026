import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export const TABLAS = {
  participantes: process.env.PARTICIPANTES_TABLE ?? 'Convencion-Participantes',
  configuracion: process.env.CONFIGURACION_TABLE ?? 'Convencion-Configuracion'
} as const

export const ES_DYNAMO_LOCAL = Boolean(process.env.DYNAMODB_ENDPOINT)

let documentClient: DynamoDBDocumentClient | undefined

export function getDocumentClient(): DynamoDBDocumentClient {
  if (!documentClient) {
    const dynamoDbClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      ...(ES_DYNAMO_LOCAL && process.env.DYNAMODB_ENDPOINT
        ? {
            endpoint: process.env.DYNAMODB_ENDPOINT,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'minioadmin',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'minioadmin'
            }
          }
        : {})
    })
    documentClient = DynamoDBDocumentClient.from(dynamoDbClient)
  }
  return documentClient
}