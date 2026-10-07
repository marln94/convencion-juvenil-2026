import { describe, expect, it } from 'vitest'

import { EQUIPOS, elegirEquipo, nombresEquipos } from '@convencion/shared-types'

import { barajar, crearGeneradorAleatorio } from './sorteo.js'

const EQUIPOS_ESPERADOS = [
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

describe('EQUIPOS', () => {
  it('es la lista acordada de 13 equipos con nombre y color', () => {
    expect(EQUIPOS).toEqual(EQUIPOS_ESPERADOS)
    expect(nombresEquipos).toHaveLength(13)
    expect(new Set(nombresEquipos).size).toBe(13)
  })
})

describe('elegirEquipo', () => {
  function conteosVacios(): Record<string, number> {
    const conteos: Record<string, number> = {}
    for (const nombre of nombresEquipos) conteos[nombre] = 0
    return conteos
  }

  it('reparte a los primeros asistentes en equipos distintos completando los 13', () => {
    const conteos = conteosVacios()
    const asignados: string[] = []
    for (let i = 0; i < 13; i++) {
      const equipo = elegirEquipo(conteos, crearGeneradorAleatorio(`arranque-${i}`))
      conteos[equipo]!++
      asignados.push(equipo)
    }
    expect(new Set(asignados).size).toBe(13)
  })

  it('reparte 800 asignaciones consecutivas con diferencia máxima de 1', () => {
    const conteos = conteosVacios()
    for (let i = 0; i < 800; i++) {
      const equipo = elegirEquipo(conteos, crearGeneradorAleatorio(`tanda-${i}`))
      conteos[equipo]!++
    }
    const tamagnos = Object.values(conteos)
    expect(Math.max(...tamagnos) - Math.min(...tamagnos)).toBeLessThanOrEqual(1)
  })

  it('elige solo entre los equipos con el mínimo actual', () => {
    const conteos: Record<string, number> = {}
    for (const nombre of nombresEquipos) conteos[nombre] = 3
    conteos['Daniel'] = 1
    conteos['María'] = 1

    for (let i = 0; i < 20; i++) {
      const equipo = elegirEquipo(conteos, crearGeneradorAleatorio(`min-${i}`))
      expect(['Daniel', 'María']).toContain(equipo)
    }
  })

  it('desempata aleatoriamente sin orden fijo de prioridad', () => {
    const conteos: Record<string, number> = {}
    for (const nombre of nombresEquipos) conteos[nombre] = 5
    conteos['David'] = 2
    conteos['Pedro'] = 2

    const rngBajo = () => 0
    const rngAlto = () => 0.9999

    const delBajo = elegirEquipo(conteos, rngBajo)
    const delAlto = elegirEquipo(conteos, rngAlto)
    expect(['David', 'Pedro']).toContain(delBajo)
    expect(['David', 'Pedro']).toContain(delAlto)
    expect(new Set([delBajo, delAlto]).size).toBe(2)
  })

  it('es determinista con el mismo generador', () => {
    const primera: string[] = []
    const segunda: string[] = []
    for (let i = 0; i < 50; i++) {
      const conteosA = conteosVacios()
      const conteosB = conteosVacios()
      for (let j = 0; j < 6; j++) {
        primera.push(elegirEquipo(conteosA, crearGeneradorAleatorio('fija')))
        segunda.push(elegirEquipo(conteosB, crearGeneradorAleatorio('fija')))
      }
    }
    expect(primera).toEqual(segunda)
  })

  it('lanza error si no hay equipos configurados', () => {
    expect(() => elegirEquipo({})).toThrow('No hay equipos configurados para asignar')
  })
})

describe('barajar', () => {
  it('devolverá todos los elementos, en orden distinto permitido por el rng', () => {
    const rng = crearGeneradorAleatorio('semilla')
    const salida = barajar([1, 2, 3, 4, 5], rng)
    expect([...salida].sort()).toEqual([1, 2, 3, 4, 5])
  })
})