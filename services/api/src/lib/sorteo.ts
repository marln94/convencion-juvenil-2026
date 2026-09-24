export const COLORES_EQUIPO_POR_DEFECTO = [
  'rojo',
  'azul',
  'verde',
  'amarillo',
  'naranja',
  'morado',
  'rosa',
  'celeste',
  'marron',
  'gris',
  'blanco',
  'negro',
  'turquesa'
] as const

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

export function sortearEquipos(
  ids: readonly string[],
  colores: readonly string[],
  semilla = crearSemilla()
): Record<string, string> {
  if (colores.length === 0) {
    throw new Error('No hay colores configurados para sortear equipos')
  }

  const barajados = barajar(ids, crearGeneradorAleatorio(semilla))
  const asignacion: Record<string, string> = {}
  barajados.forEach((id, indice) => {
    asignacion[id] = colores[indice % colores.length]!
  })
  return asignacion
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