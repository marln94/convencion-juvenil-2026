import type { Participante, ResumenParticipante } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.AUTH_BYPASS_DEV = 'true'
process.env.AUTH_BYPASS_ROL = 'admin'

const {
  obtenerConfigMock,
  actualizarColoresMock,
  obtenerParticipanteMock,
  asignarEquipoColorManualMock,
  contarPorEquipoMock,
  listarIntegrantesMock
} = vi.hoisted(() => ({
  obtenerConfigMock: vi.fn(),
  actualizarColoresMock: vi.fn(),
  obtenerParticipanteMock: vi.fn(),
  asignarEquipoColorManualMock: vi.fn(),
  contarPorEquipoMock: vi.fn(),
  listarIntegrantesMock: vi.fn()
}))

vi.mock('../repos/configuracion.js', () => ({
  obtenerConfiguracionEquipos: obtenerConfigMock,
  actualizarColores: actualizarColoresMock
}))

vi.mock('../repos/participantes.js', () => ({
  obtenerParticipante: obtenerParticipanteMock,
  asignarEquipoColorManual: asignarEquipoColorManualMock,
  contarPorEquipo: contarPorEquipoMock,
  listarIntegrantesDeEquipo: listarIntegrantesMock
}))

import app from './generar-equipos.js'

function pagado(id: string): Participante {
  return {
    participantId: id,
    nombre: `Participante ${id}`,
    contacto: '8877-1122',
    localidad: 'Tegucigalpa',
    region: '1',
    edad: 25,
    diasAsistencia: ['jueves-24'],
    rol: 'joven',
    esRegistroPorEncargado: false,
    tipoRegistro: 'online',
    estadoPago: 'pagado',
    checkIn: true,
    checkInTimestamp: '2026-09-10T10:00:00.000Z',
    fechaRegistro: '2026-09-01T00:00:00.000Z'
  }
}

const resumenDaniel: ResumenParticipante = {
  participantId: 'id-1',
  nombre: 'Participante id-1',
  estadoPago: 'pagado',
  fechaRegistro: '2026-09-01T00:00:00.000Z',
  equipoColor: 'Daniel',
  checkIn: true
}

beforeEach(() => {
  reiniciarMocks()
})

function reiniciarMocks(): void {
  obtenerConfigMock.mockReset()
  actualizarColoresMock.mockReset()
  obtenerParticipanteMock.mockReset()
  asignarEquipoColorManualMock.mockReset()
  contarPorEquipoMock.mockReset()
  listarIntegrantesMock.mockReset()
  obtenerConfigMock.mockResolvedValue(undefined)
}

describe('POST /equipos/asignar', () => {
  it('reasigna el equipo de un participante y lo devuelve', async () => {
    const pagadoDaniel = { ...pagado('id-1'), equipoColor: 'Daniel' }
    obtenerParticipanteMock.mockResolvedValue(pagadoDaniel)
    asignarEquipoColorManualMock.mockResolvedValue(pagadoDaniel)

    const res = await app.request('/equipos/asignar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'id-1', equipoColor: 'Rut' })
    })

    expect(res.status).toBe(200)
    expect(asignarEquipoColorManualMock).toHaveBeenCalledWith('id-1', 'Rut')
    const body = (await res.json()) as { participante: Participante }
    expect(body.participante.participantId).toBe('id-1')
  })

  it('responde 404 si el participante no existe', async () => {
    obtenerParticipanteMock.mockResolvedValue(undefined)

    const res = await app.request('/equipos/asignar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'fantasma', equipoColor: 'Rut' })
    })

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ message: 'El código no corresponde a un participante' })
    expect(asignarEquipoColorManualMock).not.toHaveBeenCalled()
  })

  it('rechaza 400 si el equipo no está en la lista activa', async () => {
    obtenerParticipanteMock.mockResolvedValue(pagado('id-1'))
    contarPorEquipoMock.mockResolvedValue({ Daniel: 1 })

    const res = await app.request('/equipos/asignar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'id-1', equipoColor: 'Azul' })
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El equipo seleccionado no existe' })
    expect(asignarEquipoColorManualMock).not.toHaveBeenCalled()
  })

  it('responde 400 si falta el equipoColor', async () => {
    const res = await app.request('/equipos/asignar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'id-1' })
    })

    expect(res.status).toBe(400)
    expect(obtenerParticipanteMock).not.toHaveBeenCalled()
  })
})

describe('GET /equipos/conteos', () => {
  it('devuelve los conteos de la lista por defecto', async () => {
    contarPorEquipoMock.mockResolvedValue({ Daniel: 10, Rut: 9 })

    const res = await app.request('/equipos/conteos', { method: 'GET' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ Daniel: 10, Rut: 9 })
    expect(contarPorEquipoMock).toHaveBeenCalledWith(
      expect.arrayContaining(['Daniel', 'Timoteo', 'Nehemías'])
    )
  })

  it('usa la lista configurada cuando existe', async () => {
    obtenerConfigMock.mockResolvedValue({ configId: 'equipos', colores: ['Daniel', 'Rut'] })
    contarPorEquipoMock.mockResolvedValue({ Daniel: 1, Rut: 2 })

    await app.request('/equipos/conteos', { method: 'GET' })

    expect(contarPorEquipoMock).toHaveBeenCalledWith(['Daniel', 'Rut'])
  })
})

describe('POST /equipos/config', () => {
  it('guarda la lista de equipos y devuelve la configuración', async () => {
    actualizarColoresMock.mockResolvedValue({
      configId: 'equipos',
      colores: ['Daniel', 'Rut']
    })

    const res = await app.request('/equipos/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colores: ['Daniel', 'Rut'] })
    })

    expect(res.status).toBe(200)
    expect(actualizarColoresMock).toHaveBeenCalledWith(['Daniel', 'Rut'])
    expect(await res.json()).toEqual({ configId: 'equipos', colores: ['Daniel', 'Rut'] })
  })

  it('responde 400 si la lista de equipos está vacía', async () => {
    const res = await app.request('/equipos/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colores: [] })
    })

    expect(res.status).toBe(400)
    expect(actualizarColoresMock).not.toHaveBeenCalled()
  })
})

describe('GET /equipos/:color y GET /equipos', () => {
  it('devuelve los integrantes de un equipo', async () => {
    listarIntegrantesMock.mockResolvedValue([resumenDaniel])

    const res = await app.request('/equipos/Daniel', { method: 'GET' })

    expect(res.status).toBe(200)
    expect(listarIntegrantesMock).toHaveBeenCalledWith('Daniel')
    expect(await res.json()).toEqual({ color: 'Daniel', items: [resumenDaniel] })
  })

  it('devuelve la asignación completa con conteos', async () => {
    listarIntegrantesMock.mockImplementation(async (color: string) =>
      color === 'Daniel' ? [resumenDaniel] : []
    )
    contarPorEquipoMock.mockResolvedValue({ Daniel: 1 })

    const res = await app.request('/equipos', { method: 'GET' })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      asignacion: Record<string, string>
      porColor: Record<string, string[]>
      conteos: Record<string, number>
    }
    expect(body.asignacion).toEqual({ 'id-1': 'Daniel' })
    expect(body.porColor['Daniel']).toEqual(['id-1'])
    expect(body.conteos['Daniel']).toBe(1)
  })

  it('usa los equipos configurados en GET /equipos', async () => {
    obtenerConfigMock.mockResolvedValue({ configId: 'equipos', colores: ['Daniel', 'Rut'] })
    listarIntegrantesMock.mockResolvedValue([])
    contarPorEquipoMock.mockResolvedValue({ Daniel: 0, Rut: 0 })

    const res = await app.request('/equipos', { method: 'GET' })

    expect(res.status).toBe(200)
    expect(listarIntegrantesMock).toHaveBeenCalledWith('Daniel')
    expect(listarIntegrantesMock).toHaveBeenCalledWith('Rut')
    expect(contarPorEquipoMock).toHaveBeenCalledWith(['Daniel', 'Rut'])
  })
})