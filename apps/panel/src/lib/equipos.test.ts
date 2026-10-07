import { describe, expect, it } from 'vitest'

import { EQUIPOS, type ResumenParticipante } from '@convencion/shared-types'

import {
  contarPorEquipoLocal,
  elegirEquipoLocal,
  hexPorNombre,
  textoSobreColor
} from './equipos.js'

function resumen(equipoColor?: string): Pick<ResumenParticipante, 'equipoColor'> {
  return { equipoColor }
}

function participantesCon(intensidades: Record<string, number>) {
  const participantes: Array<Pick<ResumenParticipante, 'equipoColor'>> = []
  for (const equipo of EQUIPOS) {
    for (let i = 0; i < (intensidades[equipo.nombre] ?? 99); i++) {
      participantes.push(resumen(equipo.nombre))
    }
  }
  return participantes
}

describe('hexPorNombre', () => {
  it('devuelve el color de cada equipo conocido', () => {
    expect(hexPorNombre('Daniel')).toBe('#FFD130')
    expect(hexPorNombre('Nehemías')).toBe('#FFFFFF')
  })

  it('devuelve undefined para un color desconocido', () => {
    expect(hexPorNombre('Azul')).toBeUndefined()
  })
})

describe('textoSobreColor', () => {
  it('usa texto oscuro sobre fondos claros', () => {
    expect(textoSobreColor('#FFFFFF')).toBe('#17120F')
    expect(textoSobreColor('#9ADAFF')).toBe('#17120F')
  })

  it('usa texto claro sobre fondos oscuros', () => {
    expect(textoSobreColor('#2048FF')).toBe('#FFFFFF')
    expect(textoSobreColor('#2B272F')).toBe('#FFFFFF')
  })
})

describe('contarPorEquipoLocal', () => {
  it('inicializa los 13 equipos en cero', () => {
    const conteos = contarPorEquipoLocal([])
    expect(Object.keys(conteos)).toHaveLength(13)
    expect(Object.values(conteos).every((conteo) => conteo === 0)).toBe(true)
  })

  it('cuenta solo equipos de la lista oficial', () => {
    const conteos = contarPorEquipoLocal([
      resumen('Daniel'),
      resumen('Daniel'),
      resumen('María'),
      resumen('Azul'), // antiguo nombre en español: se ignora
      resumen()
    ])
    expect(conteos['Daniel']).toBe(2)
    expect(conteos['María']).toBe(1)
  })
})

describe('elegirEquipoLocal', () => {
  it('elige el equipo con menor conteo, desempatando con el rng', () => {
    const participantes = participantesCon({ Daniel: 2, José: 2, Abel: 2, David: 2 })
    const rngBajo = () => 0
    const rngAlto = () => 0.9999

    const elegido = elegirEquipoLocal(participantes, rngBajo)
    const alternativo = elegirEquipoLocal(participantes, rngAlto)
    expect(['Daniel', 'José', 'Abel', 'David']).toContain(elegido)
    expect(['Daniel', 'José', 'Abel', 'David']).toContain(alternativo)
    expect(new Set([elegido, alternativo]).size).toBe(2)
  })
})