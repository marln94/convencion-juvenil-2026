import { describe, expect, it } from 'vitest'

import { COLORES_EQUIPO_POR_DEFECTO, sortearEquipos } from './sorteo.js'

const IDS = Array.from({ length: 800 }, (_, i) => `id-${i}`)

describe('sortearEquipos', () => {
  it('reparte balanceado con diferencia máxima de 1', () => {
    const asignacion = sortearEquipos(IDS, COLORES_EQUIPO_POR_DEFECTO, 'semilla-balance')

    const tamagnos = COLORES_EQUIPO_POR_DEFECTO.map(
      (color) => Object.values(asignacion).filter((valor) => valor === color).length
    )
    expect(Math.max(...tamagnos) - Math.min(...tamagnos)).toBeLessThanOrEqual(1)
  })

  it('asigna cada id exactamente una vez', () => {
    const asignacion = sortearEquipos(IDS, COLORES_EQUIPO_POR_DEFECTO, 'semilla-unica')

    expect(Object.keys(asignacion)).toHaveLength(IDS.length)
  })

  it('es determinista con la misma semilla', () => {
    const primera = sortearEquipos(IDS, COLORES_EQUIPO_POR_DEFECTO, 'semilla-fija')
    const segunda = sortearEquipos(IDS, COLORES_EQUIPO_POR_DEFECTO, 'semilla-fija')

    expect(primera).toEqual(segunda)
  })

  it('cambia la asignación con semillas distintas', () => {
    const primera = sortearEquipos(IDS, COLORES_EQUIPO_POR_DEFECTO, 'semilla-a')
    const segunda = sortearEquipos(IDS, COLORES_EQUIPO_POR_DEFECTO, 'semilla-b')

    expect(primera).not.toEqual(segunda)
  })

  it('devuelve asignación vacía si no hay ids', () => {
    expect(sortearEquipos([], COLORES_EQUIPO_POR_DEFECTO, 'semilla')).toEqual({})
  })

  it('lanza error si no hay colores configurados', () => {
    expect(() => sortearEquipos(IDS, [], 'semilla')).toThrow(
      'No hay colores configurados para sortear equipos'
    )
  })
})