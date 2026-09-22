import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export const TABLAS = {
  participantes: process.env.PARTICIPANTES_TABLE ?? 'Convencion-Participantes',
  configuracion: process.env.CONFIGURACION_TABLE ?? 'Convencion-Configuracion'
} as const

let documentClient: DynamoDBDocumentClient | undefined

export function getDocumentClient(): DynamoDBDocumentClient {
  if (!documentClient) {
    const dynamoDbClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'us-east-1'
    })
    documentClient = DynamoDBDocumentClient.from(dynamoDbClient)
  }
  return documentClient
}