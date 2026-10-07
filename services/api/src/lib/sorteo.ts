/**
 * Re-export de la regla de reparto: vive en `@convencion/shared-types` para que
 * servidor y panel usen la misma elección (mínimo + desempate aleatorio).
 */
export { elegirEquipo } from '@convencion/shared-types'

export function crearSemilla(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function crearGeneradorAleatorio(semillaTexto: string): () => number {
  return mulberry32(semillaNumerica(semillaTexto))
}

export function barajar<T>(elementos: readonly T[], rng: () => number): T[] {
  const copia = [...elementos]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const aux = copia[i]!
    copia[i] = copia[j]!
    copia[j] = aux
  }
  return copia
}

function semillaNumerica(semilla: string): number {
  let valor = 2166136261
  for (const caracterDeSemilla of semilla) {
    valor ^= caracterDeSemilla.charCodeAt(0)
    valor = Math.imul(valor, 16777619)
  }
  return valor >>> 0
}

function mulberry32(semilla: number): () => number {
  return () => {
    semilla = (semilla + 0x6d2b79f5) | 0
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}