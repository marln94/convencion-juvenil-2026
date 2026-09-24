import type { ApiClient } from '@convencion/api-client'
import { ApiError } from '@convencion/api-client'
import type { RegistrarParticipanteInput } from '@convencion/shared-types'

import { obtenerBaseDatos } from './persistencia.js'

export interface RegistroInsituEnCola extends RegistrarParticipanteInput {
  tipoRegistro: 'in_situ'
  participantId: string
}

export type OperacionCola =
  | { id: string; tipo: 'checkin'; payload: { participantId: string }; creadoEn: string }
  | { id: string; tipo: 'registro_insitu'; payload: RegistroInsituEnCola; creadoEn: string }

export function crearIdCola(): string {
  return `${Date.now()}-${crypto.randomUUID()}`
}

export async function encolarOperacion(
  tipo: 'checkin',
  payload: { participantId: string }
): Promise<void>
export async function encolarOperacion(
  tipo: 'registro_insitu',
  payload: RegistroInsituEnCola
): Promise<void>
export async function encolarOperacion(
  tipo: 'checkin' | 'registro_insitu',
  payload: { participantId: string } | RegistroInsituEnCola
): Promise<void> {
  const db = await obtenerBaseDatos()
  const creadoEn = new Date().toISOString()
  const operacion: OperacionCola =
    tipo === 'checkin'
      ? {
          id: crearIdCola(),
          tipo: 'checkin',
          payload: payload as { participantId: string },
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

export async function sincronizarCola(apiCliente: ApiClient): Promise<void> {
  const db = await obtenerBaseDatos()
  const pendientes = (await db.getAll('cola')) as OperacionCola[]

  for (const operacion of pendientes) {
    try {
      if (operacion.tipo === 'checkin') {
        await apiCliente.checkIn({ participantId: operacion.payload.participantId })
      } else {
        await apiCliente.registrarParticipante(operacion.payload)
      }
      await eliminarDeCola(operacion.id)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Duplicado (p. ej. dos staff registraron al mismo in situ): el servidor ya
        // lo tiene, se descarta sin perder el QR mostrado en pantalla.
        await eliminarDeCola(operacion.id)
      } else {
        // Se detiene la sincronización para no perder el orden; el resto queda en cola.
        break
      }
    }
  }
}

async function putCola(operacion: OperacionCola): Promise<void> {
  const db = await obtenerBaseDatos()
  await db.put('cola', operacion)
}