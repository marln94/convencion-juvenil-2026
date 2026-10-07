import type { ApiClient } from '@convencion/api-client'
import { ApiError } from '@convencion/api-client'
import type { RegistrarParticipanteInput } from '@convencion/shared-types'

import { eliminarDelIndice } from './indice.js'
import { obtenerBaseDatos } from './persistencia.js'

export interface CheckInEnCola {
  participantId: string
  equipoColor?: string
}

export interface RegistroInsituEnCola extends RegistrarParticipanteInput {
  tipoRegistro: 'in_situ'
  participantId: string
}

export type OperacionCola =
  | { id: string; tipo: 'checkin'; payload: CheckInEnCola; creadoEn: string }
  | { id: string; tipo: 'registro_insitu'; payload: RegistroInsituEnCola; creadoEn: string }

export type OperacionDescartada = OperacionCola & {
  status: number
  motivo: string
  descartadaEn: string
}

/**
 * Respuestas en las que reintentar el mismo payload no puede cambiar el
 * resultado, así que la operación sale de la cola:
 *
 * - 400: el servidor rechazó la validación. Reintentarlo da el mismo 400.
 * - 404: el participante no existe. Típico de un checkin encolado contra un
 *   registro que el propio panel descartó, o que nunca llegó al servidor.
 * - 409: el servidor ya lo tiene. No hay nada que sincronizar.
 *
 * Todo lo demás (401, 403, 429, 5xx, corte de red) se trata como transitorio y
 * detiene el loop para no perder el orden de las operaciones siguientes.
 */
const RESPUESTAS_DEFINITIVAS = new Set([400, 404, 409])

export function crearIdCola(): string {
  return `${Date.now()}-${crypto.randomUUID()}`
}

export async function encolarOperacion(
  tipo: 'checkin',
  payload: CheckInEnCola
): Promise<void>
export async function encolarOperacion(
  tipo: 'registro_insitu',
  payload: RegistroInsituEnCola
): Promise<void>
export async function encolarOperacion(
  tipo: 'checkin' | 'registro_insitu',
  payload: CheckInEnCola | RegistroInsituEnCola
): Promise<void> {
  const db = await obtenerBaseDatos()
  const creadoEn = new Date().toISOString()
  const operacion: OperacionCola =
    tipo === 'checkin'
      ? {
          id: crearIdCola(),
          tipo: 'checkin',
          payload: payload as CheckInEnCola,
          creadoEn
        }
      : {
          id: crearIdCola(),
          tipo: 'registro_insitu',
          payload: payload as RegistroInsituEnCola,
          creadoEn
        }
  await putCola(operacion)
}

export async function contarPendientes(): Promise<number> {
  const db = await obtenerBaseDatos()
  return db.count('cola')
}

export async function eliminarDeCola(id: string): Promise<void> {
  const db = await obtenerBaseDatos()
  await db.delete('cola', id)
}

export async function contarDescartadas(): Promise<number> {
  const db = await obtenerBaseDatos()
  return db.count('descartadas')
}

export async function listarDescartadas(): Promise<OperacionDescartada[]> {
  const db = await obtenerBaseDatos()
  return (await db.getAll('descartadas')) as OperacionDescartada[]
}

export async function limpiarDescartadas(): Promise<void> {
  const db = await obtenerBaseDatos()
  await db.clear('descartadas')
}

export async function sincronizarCola(apiCliente: ApiClient): Promise<void> {
  const db = await obtenerBaseDatos()
  const pendientes = (await db.getAll('cola')) as OperacionCola[]

  for (const operacion of pendientes) {
    try {
      if (operacion.tipo === 'checkin') {
        await apiCliente.checkIn(operacion.payload)
      } else {
        await apiCliente.registrarParticipante(operacion.payload)
      }
      await eliminarDeCola(operacion.id)
    } catch (error) {
      if (error instanceof ApiError && RESPUESTAS_DEFINITIVAS.has(error.status)) {
        await descartar(operacion, error)
      } else {
        // Transitorio: se detiene la sincronización para no perder el orden; el
        // resto queda en cola y se reintenta en el próximo evento de red.
        break
      }
    }
  }
}

async function descartar(operacion: OperacionCola, error: ApiError): Promise<void> {
  await eliminarDeCola(operacion.id)
  if (operacion.tipo === 'registro_insitu') {
    // El registro in situ escribe en el índice local antes de encolar, así que
    // si no lo sacamos de ahí el staff ve un participante que el servidor nunca
    // recibió, y el checkin de ese QR vuelve a fallar con 404.
    await eliminarDelIndice(operacion.payload.participantId)
  }
  const db = await obtenerBaseDatos()
  const descartada: OperacionDescartada = {
    ...operacion,
    status: error.status,
    motivo: error.message,
    descartadaEn: new Date().toISOString()
  }
  await db.put('descartadas', descartada)
  console.warn(
    `[cola] operación descartada (${error.status}): ${operacion.tipo} ${operacion.id} — ${error.message}`
  )
}

async function putCola(operacion: OperacionCola): Promise<void> {
  const db = await obtenerBaseDatos()
  await db.put('cola', operacion)
}