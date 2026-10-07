import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { QueryCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb'
import type { EstadoPago, Participante, ResumenParticipante, TipoRegistro } from '@convencion/shared-types'

import { getDocumentClient, TABLAS } from '../lib/dynamo.js'
import { HttpError } from '../lib/http-error.js'

const LIMITE_POR_DEFECTO = 100
const LIMITE_MAXIMO = 500
const GSI_ESTADO_PAGO = 'GSI-EstadoPago'
const GSI_EQUIPO = 'GSI-Equipo'

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

export async function marcarCheckIn(participantId: string, equipoColor?: string): Promise<string> {
  const timestamp = new Date().toISOString()
  const client = getDocumentClient()
  const asignaEquipo = equipoColor !== undefined
  await client.send(
    new UpdateCommand({
      TableName: TABLAS.participantes,
      Key: { participantId },
      UpdateExpression: asignaEquipo
        ? 'SET checkIn = :verdadero, checkInTimestamp = if_not_exists(checkInTimestamp, :fecha), equipoColor = if_not_exists(equipoColor, :color)'
        : 'SET checkIn = :verdadero, checkInTimestamp = if_not_exists(checkInTimestamp, :fecha)',
      ExpressionAttributeValues: asignaEquipo
        ? { ':verdadero': true, ':fecha': timestamp, ':color': equipoColor }
        : { ':verdadero': true, ':fecha': timestamp }
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
    fechaRegistro: participante.fechaRegistro,
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

/**
 * Conteo de integrantes por equipo mediante 13 consultas `COUNT` sobre la GSI
 * `GSI-Equipo` (una por nombre de la lista activa). Lee el contador sin
 * transferir los ítems, así que el costo no crece con el tamaño de cada equipo.
 */
export async function contarPorEquipo(colores: readonly string[]): Promise<Record<string, number>> {
  const client = getDocumentClient()
  const conteos: Record<string, number> = {}
  for (const color of colores) {
    let total = 0
    let claveInicio: Record<string, unknown> | undefined
    do {
      const input: QueryCommandInput = {
        TableName: TABLAS.participantes,
        IndexName: GSI_EQUIPO,
        KeyConditionExpression: 'equipoColor = :color',
        ExpressionAttributeValues: { ':color': color },
        Select: 'COUNT'
      }
      if (claveInicio) {
        input.ExclusiveStartKey = claveInicio
      }
      const resultado = await client.send(new QueryCommand(input))
      total += resultado.Count ?? 0
      claveInicio = resultado.LastEvaluatedKey as Record<string, unknown> | undefined
    } while (claveInicio)
    conteos[color] = total
  }
  return conteos
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

/**
 * Reasignación manual (admin): sobrescribe el equipo y registra el momento; si
 * el participante aún no llega, conserva la primera llegada cuando suceda.
 */
export async function asignarEquipoColorManual(
  participantId: string,
  equipoColor: string
): Promise<Participante | undefined> {
  const client = getDocumentClient()
  const fechaAsignacion = new Date().toISOString()
  await client.send(
    new UpdateCommand({
      TableName: TABLAS.participantes,
      Key: { participantId },
      UpdateExpression:
        'SET equipoColor = :color, fechaAsignacionEquipo = :fecha, checkInTimestamp = if_not_exists(checkInTimestamp, :fecha)',
      ExpressionAttributeValues: { ':color': equipoColor, ':fecha': fechaAsignacion }
    })
  )
  return obtenerParticipante(participantId)
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