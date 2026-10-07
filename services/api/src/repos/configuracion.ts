import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { ConfiguracionEquipos } from '@convencion/shared-types'

import { getDocumentClient, TABLAS } from '../lib/dynamo.js'
import { HttpError } from '../lib/http-error.js'

const CLAVE_EQUIPOS = 'equipos'

interface FilaConfiguracionEquipos {
  clave: typeof CLAVE_EQUIPOS
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
    colores: fila.colores ?? []
  }
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