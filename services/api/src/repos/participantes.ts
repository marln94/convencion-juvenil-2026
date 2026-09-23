import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import type { Participante } from '@convencion/shared-types'

import { getDocumentClient, TABLAS } from '../lib/dynamo.js'
import { HttpError } from '../lib/http-error.js'

export async function crearParticipante(participante: Participante): Promise<void> {
  const client = getDocumentClient()
  try {
    await client.send(
      new PutCommand({
        TableName: TABLAS.participantes,
        Item: participante,
        ConditionExpression: 'attribute_not_exists(participantId)'
      })
    )
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new HttpError(409, 'El participante ya existe')
    }
    throw error
  }
}

export async function obtenerParticipante(participantId: string): Promise<Participante | undefined> {
  const client = getDocumentClient()
  const resultado = await client.send(
    new GetCommand({
      TableName: TABLAS.participantes,
      Key: { participantId }
    })
  )
  return resultado.Item as Participante | undefined
}