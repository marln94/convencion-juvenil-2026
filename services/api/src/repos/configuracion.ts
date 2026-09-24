import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { ConfiguracionEquipos } from '@convencion/shared-types'

import { getDocumentClient, TABLAS } from '../lib/dynamo.js'
import { HttpError } from '../lib/http-error.js'

const CLAVE_EQUIPOS = 'equipos'

interface FilaConfiguracionEquipos {
  clave: typeof CLAVE_EQUIPOS
  bloqueado?: boolean
  fechaGeneracion?: string
  colores?: string[]
}

export async function obtenerConfiguracionEquipos(): Promise<ConfiguracionEquipos | undefined> {
  const client = getDocumentClient()
  const { Item } = await client.send(
    new GetCommand({
      TableName: TABLAS.configuracion,
      Key: { clave: CLAVE_EQUIPOS }
    })
  )
  const fila = Item as FilaConfiguracionEquipos | undefined
  if (!fila) return undefined
  return {
    configId: 'equipos',
    bloqueado: fila.bloqueado ?? false,
    fechaGeneracion: fila.fechaGeneracion,
    colores: fila.colores ?? []
  }
}

export interface BloqueoRegistrado {
  bloqueado: boolean
  fechaGeneracion: string
}

export async function bloquearEquipos(): Promise<BloqueoRegistrado> {
  const fechaGeneracion = new Date().toISOString()
  const client = getDocumentClient()
  await client.send(
    new UpdateCommand({
      TableName: TABLAS.configuracion,
      Key: { clave: CLAVE_EQUIPOS },
      UpdateExpression: 'SET bloqueado = :verdadero, fechaGeneracion = :fecha',
      ExpressionAttributeValues: { ':verdadero': true, ':fecha': fechaGeneracion }
    })
  )
  return { bloqueado: true, fechaGeneracion }
}

export async function actualizarColores(colores: string[]): Promise<ConfiguracionEquipos> {
  const client = getDocumentClient()
  await client.send(
    new UpdateCommand({
      TableName: TABLAS.configuracion,
      Key: { clave: CLAVE_EQUIPOS },
      UpdateExpression: 'SET colores = :colores',
      ExpressionAttributeValues: { ':colores': colores }
    })
  )
  const config = await obtenerConfiguracionEquipos()
  if (!config) {
    throw new HttpError(500, 'No se pudo guardar la configuración de equipos')
  }
  return config
}

export async function reclamarGeneracion(): Promise<string> {
  const fechaGeneracion = new Date().toISOString()
  const client = getDocumentClient()
  try {
    await client.send(
      new UpdateCommand({
        TableName: TABLAS.configuracion,
        Key: { clave: CLAVE_EQUIPOS },
        UpdateExpression: 'SET fechaGeneracion = :fecha',
        ConditionExpression: 'attribute_not_exists(bloqueado) OR bloqueado <> :verdadero',
        ExpressionAttributeValues: { ':fecha': fechaGeneracion, ':verdadero': true }
      })
    )
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new HttpError(409, 'La asignación de equipos está bloqueada')
    }
    throw error
  }
  return fechaGeneracion
}