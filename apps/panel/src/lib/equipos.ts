import { EQUIPOS, elegirEquipo } from '@convencion/shared-types'
import type { ResumenParticipante } from '@convencion/shared-types'

import { api } from './api.js'
import { buscarEnIndice } from './indice.js'

export function hexPorNombre(nombre: string): string | undefined {
  return EQUIPOS.find((equipo) => equipo.nombre === nombre)?.hex
}

/**
 * Texto legible sobre el color de banda: usa la luminancia relativa WCAG y un
 * umbral experimental (0.179) por debajo del cual se usa texto claro. Así
 * Nehemías (blanco) recibe texto oscuro.
 */
export function textoSobreColor(hex: string): string {
  const canales = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((par) => parseInt(par, 16) / 255)
  if (!canales || canales.length !== 3) return '#FFFFFF'
  const lineal = canales.map((canal) =>
    canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
  )
  const luminancia = 0.2126 * lineal[0]! + 0.7152 * lineal[1]! + 0.0722 * lineal[2]!
  return luminancia >= 0.179 ? '#17120F' : '#FFFFFF'
}

export function contarPorEquipoLocal(
  participantes: ReadonlyArray<Pick<ResumenParticipante, 'equipoColor'>>
): Record<string, number> {
  const conteos: Record<string, number> = {}
  for (const equipo of EQUIPOS) conteos[equipo.nombre] = 0
  for (const participante of participantes) {
    if (participante.equipoColor && participante.equipoColor in conteos) {
      conteos[participante.equipoColor]!++
    }
  }
  return conteos
}

export function elegirEquipoLocal(
  participantes: ReadonlyArray<Pick<ResumenParticipante, 'equipoColor'>>,
  rng: () => number = Math.random
): string {
  return elegirEquipo(contarPorEquipoLocal(participantes), rng)
}

/**
 * Conteos actualizados: online consulta el servidor; si falla (sin conexión,
 * token vencido, etc.) cae al índice local para no romper el turno de mesa.
 */
export async function obtenerConteos(): Promise<Record<string, number>> {
  try {
    return await api.obtenerConteos()
  } catch {
    return contarPorEquipoLocal(await buscarEnIndice(''))
  }
}

/**
 * Decide el equipo para una llegada: conserva el ya asignado o elige con el
 * conteo actualizado (servidor si hay conexión, índice local si no).
 */
export async function decidirEquipoParaLlegada(
  equipoActual?: string
): Promise<string | undefined> {
  if (equipoActual) return equipoActual
  if (navigator.onLine) {
    try {
      return elegirEquipo(await api.obtenerConteos())
    } catch {
      // sin conexión real o token vencido: elige desde el índice local
    }
  }
  return elegirEquipoLocal(await buscarEnIndice(''))
}