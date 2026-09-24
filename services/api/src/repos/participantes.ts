import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { BatchWriteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { QueryCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb'
import type { EstadoPago, Participante, ResumenParticipante, TipoRegistro } from '@convencion/shared-types'

import { getDocumentClient, TABLAS } from '../lib/dynamo.js'
import { HttpError } from '../lib/http-error.js'

const LIMITE_POR_DEFECTO = 100
const LIMITE_MAXIMO = 500
const GSI_ESTADO_PAGO = 'GSI-EstadoPago'
const GSI_EQUIPO = 'GSI-Equipo'
const TAMANO_MAXIMO_BATCH = 25
const REINTENTOS_BATCH = 3

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

export async function marcarCheckIn(participantId: string): Promise<string> {
  const timestamp = new Date().toISOString()
  const client = getDocumentClient()
  await client.send(
    new UpdateCommand({
      TableName: TABLAS.participantes,
      Key: { participantId },
      UpdateExpression:
        'SET checkIn = :verdadero, checkInTimestamp = if_not_exists(checkInTimestamp, :fecha)',
      ExpressionAttributeValues: { ':verdadero': true, ':fecha': timestamp }
    })
  )
  return timestamp
}

export interface FiltrosListadoParticipantes {
  estadoPago?: EstadoPago
  tipoRegistro?: TipoRegistro
  checkIn?: boolean
  limit?: number
  nextToken?: string
}

export interface ListadoParticipantes {
  items: ResumenParticipante[]
  pagination: { nextToken?: string; total: number }
}

function aResumen(participante: Participante): ResumenParticipante {
  const resumen: ResumenParticipante = {
    participantId: participante.participantId,
    nombre: participante.nombre,
    estadoPago: participante.estadoPago,
    checkIn: participante.checkIn
  }
  if (participante.tipoRegistro) {
    resumen.tipoRegistro = participante.tipoRegistro
  }
  if (participante.equipoColor) {
    resumen.equipoColor = participante.equipoColor
  }
  return resumen
}

function obtenerClaveDeContinuacion(nextToken: string | undefined): Record<string, unknown> | undefined {
  if (!nextToken) return undefined
  try {
    return JSON.parse(nextToken) as Record<string, unknown>
  } catch {
    return undefined
  }
}

export async function listarParticipantes(
  filtros: FiltrosListadoParticipantes = {}
): Promise<ListadoParticipantes> {
  const client = getDocumentClient()
  const limit = Math.min(filtros.limit ?? LIMITE_POR_DEFECTO, LIMITE_MAXIMO)

  const filtroAdicional: string[] = []
  const valoresFiltro: Record<string, unknown> = {}
  if (filtros.tipoRegistro) {
    filtroAdicional.push('tipoRegistro = :tipoRegistro')
    valoresFiltro[':tipoRegistro'] = filtros.tipoRegistro
  }
  if (filtros.checkIn !== undefined) {
    filtroAdicional.push('checkIn = :checkIn')
    valoresFiltro[':checkIn'] = filtros.checkIn
  }

  if (filtros.estadoPago) {
    const input: QueryCommandInput = {
      TableName: TABLAS.participantes,
      IndexName: GSI_ESTADO_PAGO,
      KeyConditionExpression: 'estadoPago = :estadoPago',
      ExpressionAttributeValues: {
        ':estadoPago': filtros.estadoPago,
        ...valoresFiltro
      },
      Limit: limit,
      ScanIndexForward: false
    }
    if (filtroAdicional.length > 0) {
      input.FilterExpression = filtroAdicional.join(' AND ')
    }
    input.ExclusiveStartKey = obtenerClaveDeContinuacion(filtros.nextToken)

    const resultado = await client.send(new QueryCommand(input))
    const items = (resultado.Items as Participante[] | undefined) ?? []
    return {
      items: items.map(aResumen),
      pagination: {
        nextToken: resultado.LastEvaluatedKey
          ? JSON.stringify(resultado.LastEvaluatedKey)
          : undefined,
        total: items.length
      }
    }
  }

  const inputScan: ScanCommandInput = {
    TableName: TABLAS.participantes,
    Limit: limit
  }
  if (filtroAdicional.length > 0) {
    inputScan.FilterExpression = filtroAdicional.join(' AND ')
    inputScan.ExpressionAttributeValues = valoresFiltro
  }
  inputScan.ExclusiveStartKey = obtenerClaveDeContinuacion(filtros.nextToken)

  const resultado = await client.send(new ScanCommand(inputScan))
  const items = (resultado.Items as Participante[] | undefined) ?? []
  return {
    items: items.map(aResumen),
    pagination: {
      nextToken: resultado.LastEvaluatedKey ? JSON.stringify(resultado.LastEvaluatedKey) : undefined,
      total: items.length
    }
  }
}

export async function listarPorEstadoPago(estado: EstadoPago): Promise<Participante[]> {
  const client = getDocumentClient()
  const todos: Participante[] = []
  let claveInicio: Record<string, unknown> | undefined
  do {
    const input: QueryCommandInput = {
      TableName: TABLAS.participantes,
      IndexName: GSI_ESTADO_PAGO,
      KeyConditionExpression: 'estadoPago = :estadoPago',
      ExpressionAttributeValues: { ':estadoPago': estado },
      ScanIndexForward: false
    }
    if (claveInicio) {
      input.ExclusiveStartKey = claveInicio
    }
    const resultado = await client.send(new QueryCommand(input))
    todos.push(...((resultado.Items as Participante[] | undefined) ?? []))
    claveInicio = resultado.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (claveInicio)
  return todos
}

export async function listarIntegrantesDeEquipo(color: string): Promise<ResumenParticipante[]> {
  const client = getDocumentClient()
  const todos: Participante[] = []
  let claveInicio: Record<string, unknown> | undefined
  do {
    const input: QueryCommandInput = {
      TableName: TABLAS.participantes,
      IndexName: GSI_EQUIPO,
      KeyConditionExpression: 'equipoColor = :color',
      ExpressionAttributeValues: { ':color': color },
      ScanIndexForward: false
    }
    if (claveInicio) {
      input.ExclusiveStartKey = claveInicio
    }
    const resultado = await client.send(new QueryCommand(input))
    todos.push(...((resultado.Items as Participante[] | undefined) ?? []))
    claveInicio = resultado.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (claveInicio)
  return todos.map(aResumen)
}

export interface AsignacionEquipoItem {
  participante: Participante
  equipoColor: string
}

export async function asignarEquipoColor(asignaciones: AsignacionEquipoItem[]): Promise<void> {
  const client = getDocumentClient()
  for (let i = 0; i < asignaciones.length; i += TAMANO_MAXIMO_BATCH) {
    const chunk = asignaciones.slice(i, i + TAMANO_MAXIMO_BATCH)
    let pendientes = chunk.map(({ participante, equipoColor }) => ({
      PutRequest: { Item: { ...participante, equipoColor } }
    }))

    for (let intento = 0; intento < REINTENTOS_BATCH && pendientes.length > 0; intento++) {
      const resultado = await client.send(
        new BatchWriteCommand({
          RequestItems: { [TABLAS.participantes]: pendientes }
        })
      )
      pendientes = (resultado.UnprocessedItems?.[TABLAS.participantes] ??
        []) as unknown as typeof pendientes
    }

    if (pendientes.length > 0) {
      throw new HttpError(500, 'No se pudo guardar la asignación de equipos')
    }
  }
}

const TRANSICIONES_VALIDAS: Record<EstadoPago, readonly EstadoPago[]> = {
  pendiente: [],
  pagado: ['pendiente', 'rechazado'],
  rechazado: ['pendiente']
}

export interface ActualizarEstadoPagoInput {
  estado: EstadoPago
  motivoRechazo?: string
}

export async function actualizarEstadoPago(
  participantId: string,
  cambios: ActualizarEstadoPagoInput
): Promise<Participante | undefined> {
  const actual = await obtenerParticipante(participantId)
  if (!actual) return undefined

  const permitidos = TRANSICIONES_VALIDAS[cambios.estado]
  if (!permitidos.includes(actual.estadoPago)) {
    throw new HttpError(409, 'Transición de estado inválida: el comprobante ya fue revisado')
  }

  const esAprobacion = cambios.estado === 'pagado'
  const motivo = esAprobacion ? undefined : cambios.motivoRechazo
  const revisadoEn = new Date().toISOString()

  const valores: Record<string, unknown> = { ':estado': cambios.estado, ':revisadoEn': revisadoEn }
  let updateExpression = 'SET estadoPago = :estado, revisadoEn = :revisadoEn'
  if (motivo) {
    updateExpression += ', motivoRechazo = :motivo'
    valores[':motivo'] = motivo
  } else {
    updateExpression += ' REMOVE motivoRechazo'
  }

  const client = getDocumentClient()
  await client.send(
    new UpdateCommand({
      TableName: TABLAS.participantes,
      Key: { participantId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: valores
    })
  )

  return obtenerParticipante(participantId)
}