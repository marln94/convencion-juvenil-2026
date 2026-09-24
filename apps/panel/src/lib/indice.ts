import type { ResumenParticipante } from '@convencion/shared-types'

import { obtenerBaseDatos } from './persistencia.js'

export async function actualizarIndice(items: ResumenParticipante[]): Promise<void> {
  const db = await obtenerBaseDatos()
  const tx = db.transaction('indice', 'readwrite')
  for (const item of items) {
    await tx.store.put(item)
  }
  await tx.done
}

export async function agregarAlIndice(item: ResumenParticipante): Promise<void> {
  const db = await obtenerBaseDatos()
  await db.put('indice', item)
}

export async function obtenerDelIndice(
  participantId: string
): Promise<ResumenParticipante | undefined> {
  const db = await obtenerBaseDatos()
  return db.get('indice', participantId)
}

export async function buscarEnIndice(texto: string): Promise<ResumenParticipante[]> {
  const db = await obtenerBaseDatos()
  const todos = (await db.getAll('indice')) as ResumenParticipante[]
  const termino = texto.trim().toLowerCase()
  if (!termino) return todos
  return todos.filter((participante) => participante.nombre.toLowerCase().includes(termino))
}

export async function actualizarEquiposEnIndice(
  asignacion: Record<string, string>
): Promise<void> {
  const db = await obtenerBaseDatos()
  const tx = db.transaction('indice', 'readwrite')
  for (const [participantId, equipoColor] of Object.entries(asignacion)) {
    const existente = await tx.store.get(participantId)
    if (existente) {
      await tx.store.put({ ...existente, equipoColor })
    }
  }
  await tx.done
}