export interface Equipo {
  nombre: string
  hex: string
}

/**
 * Lista fija de los 13 equipos de la convención. Fuente única: el servidor
 * deriva los nombres por defecto y el panel el mapa `nombre → hex`, para que
 * ambos no puedan divergir.
 */
export const EQUIPOS: readonly Equipo[] = [
  { nombre: 'Daniel', hex: '#FFD130' },
  { nombre: 'Timoteo', hex: '#FD8211' },
  { nombre: 'José', hex: '#FF103A' },
  { nombre: 'Abel', hex: '#E71F93' },
  { nombre: 'David', hex: '#8C51FF' },
  { nombre: 'Rut', hex: '#2048FF' },
  { nombre: 'Mardoqueo', hex: '#9ADAFF' },
  { nombre: 'Pedro', hex: '#00D6BF' },
  { nombre: 'Mathias', hex: '#74CB01' },
  { nombre: 'María', hex: '#2E6417' },
  { nombre: 'Josué', hex: '#852F1C' },
  { nombre: 'Caleb', hex: '#2B272F' },
  { nombre: 'Nehemías', hex: '#FFFFFF' }
] as const

export const nombresEquipos: readonly string[] = EQUIPOS.map((equipo) => equipo.nombre)

export function equipoPorNombre(nombre: string): Equipo | undefined {
  return EQUIPOS.find((equipo) => equipo.nombre === nombre)
}

/**
 * Regla de reparto equitativo: elige al azar entre los equipos con el menor
 * conteo actual. Con asignaciones seriadas la diferencia entre el mayor y el
 * menor queda en 1. El RNG por defecto es libre; se inyecta en los tests y en
 * el servidor para volver determinista la elección.
 */
export function elegirEquipo(
  conteos: Readonly<Record<string, number>>,
  rng: () => number = Math.random
): string {
  const nombres = Object.keys(conteos)
  if (nombres.length === 0) {
    throw new Error('No hay equipos configurados para asignar')
  }
  const minimo = Math.min(...nombres.map((nombre) => conteos[nombre] ?? 0))
  const candidatos = nombres.filter((nombre) => (conteos[nombre] ?? 0) === minimo)
  const barajados = [...candidatos]
  for (let i = barajados.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const aux = barajados[i]!
    barajados[i] = barajados[j]!
    barajados[j] = aux
  }
  return barajados[0]!
}