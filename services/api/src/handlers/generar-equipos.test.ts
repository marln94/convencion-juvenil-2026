import type { Participante, ResumenParticipante } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.AUTH_BYPASS_DEV = 'true'
process.env.AUTH_BYPASS_ROL = 'admin'

const {
  obtenerConfigMock,
  bloquearEquiposMock,
  actualizarColoresMock,
  reclamarGeneracionMock,
  listarPorEstadoPagoMock,
  listarIntegrantesMock,
  asignarEquipoColorMock
} = vi.hoisted(() => ({
  obtenerConfigMock: vi.fn(),
  bloquearEquiposMock: vi.fn(),
  actualizarColoresMock: vi.fn(),
  reclamarGeneracionMock: vi.fn(),
  listarPorEstadoPagoMock: vi.fn(),
  listarIntegrantesMock: vi.fn(),
  asignarEquipoColorMock: vi.fn()
}))

vi.mock('../repos/configuracion.js', () => ({
  obtenerConfiguracionEquipos: obtenerConfigMock,
  bloquearEquipos: bloquearEquiposMock,
  actualizarColores: actualizarColoresMock,
  reclamarGeneracion: reclamarGeneracionMock
}))
vi.mock('../repos/participantes.js', () => ({
  crearParticipante: vi.fn(),
  obtenerParticipante: vi.fn(),
  listarParticipantes: vi.fn(),
  listarPorEstadoPago: listarPorEstadoPagoMock,
  listarIntegrantesDeEquipo: listarIntegrantesMock,
  asignarEquipoColor: asignarEquipoColorMock
}))

import { HttpError } from '../lib/http-error.js'
import app from './generar-equipos.js'

const COLORES_DEFECTO = [
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
]

function pagado(id: string): Participante {
  return {
    participantId: id,
    nombre: `Participante ${id}`,
    contacto: '8877-1122',
    esRegistroPorEncargado: false,
    tipoRegistro: 'online',
    estadoPago: 'pagado',
    checkIn: false,
    fechaRegistro: '2026-09-01T00:00:00.000Z'
  }
}

const resumenRojo: ResumenParticipante = {
  participantId: 'id-1',
  nombre: 'Participante id-1',
  estadoPago: 'pagado',
  equipoColor: 'rojo',
  checkIn: false
}

beforeEach(() => {
  reiniciarMocks()
})

function reiniciarMocks(): void {
  obtenerConfigMock.mockReset()
  bloquearEquiposMock.mockReset()
  actualizarColoresMock.mockReset()
  reclamarGeneracionMock.mockReset()
  listarPorEstadoPagoMock.mockReset()
  listarIntegrantesMock.mockReset()
  asignarEquipoColorMock.mockReset()
  reclamarGeneracionMock.mockResolvedValue('2026-09-10T12:00:00.000Z')
  obtenerConfigMock.mockResolvedValue(undefined)
}

describe('POST /equipos/generar', () => {
  it('genera asignación balanceada solo con pagados y la persiste', async () => {
    const pagados = Array.from({ length: 51 }, (_, i) => pagado(`id-${i}`))
    listarPorEstadoPagoMock.mockResolvedValue(pagados)
    asignarEquipoColorMock.mockResolvedValue(undefined)

    const res = await app.request('/equipos/generar', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(reclamarGeneracionMock).toHaveBeenCalledTimes(1)
    const body = (await res.json()) as {
      asignacion: Record<string, string>
      porColor: Record<string, string[]>
      bloqueado: boolean
    }
    expect(Object.keys(body.asignacion)).toHaveLength(51)
    expect(body.bloqueado).toBe(false)

    const tamagnos = COLORES_DEFECTO.map((color) => body.porColor[color]?.length ?? 0)
    expect(Math.max(...tamagnos) - Math.min(...tamagnos)).toBeLessThanOrEqual(1)

    expect(asignarEquipoColorMock).toHaveBeenCalledTimes(1)
    const escrituras = asignarEquipoColorMock.mock.calls[0]![0] as { participante: Participante; equipoColor: string }[]
    expect(escrituras).toHaveLength(51)
    for (const escritura of escrituras) {
      expect(body.asignacion[escritura.participante.participantId]).toBe(escritura.equipoColor)
    }
  })

  it('responde 409 si la asignación está bloqueada', async () => {
    reclamarGeneracionMock.mockRejectedValue(
      new HttpError(409, 'La asignación de equipos está bloqueada')
    )

    const res = await app.request('/equipos/generar', { method: 'POST' })

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ message: 'La asignación de equipos está bloqueada' })
    expect(listarPorEstadoPagoMock).not.toHaveBeenCalled()
  })

  it('no incluye a los no pagados', async () => {
    listarPorEstadoPagoMock.mockResolvedValue([])
    asignarEquipoColorMock.mockResolvedValue(undefined)

    const res = await app.request('/equipos/generar', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(listarPorEstadoPagoMock).toHaveBeenCalledWith('pagado')
    const body = (await res.json()) as { asignacion: Record<string, string> }
    expect(Object.keys(body.asignacion)).toHaveLength(0)
  })
})

describe('POST /equipos/bloquear', () => {
  it('bloquea la asignación y devuelve el estado', async () => {
    bloquearEquiposMock.mockResolvedValue({
      bloqueado: true,
      fechaGeneracion: '2026-09-10T12:00:00.000Z'
    })

    const res = await app.request('/equipos/bloquear', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ bloqueado: true, fechaGeneracion: '2026-09-10T12:00:00.000Z' })
  })
})

describe('POST /equipos/config', () => {
  it('guarda la lista de colores y devuelve la configuración', async () => {
    actualizarColoresMock.mockResolvedValue({
      configId: 'equipos',
      bloqueado: false,
      colores: ['verde', 'negro']
    })

    const res = await app.request('/equipos/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colores: ['verde', 'negro'] })
    })

    expect(res.status).toBe(200)
    expect(actualizarColoresMock).toHaveBeenCalledWith(['verde', 'negro'])
    expect(await res.json()).toEqual({ configId: 'equipos', bloqueado: false, colores: ['verde', 'negro'] })
  })

  it('responde 400 si la lista de colores está vacía', async () => {
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
  it('devuelve los integrantes de un color', async () => {
    listarIntegrantesMock.mockResolvedValue([resumenRojo])

    const res = await app.request('/equipos/rojo', { method: 'GET' })

    expect(res.status).toBe(200)
    expect(listarIntegrantesMock).toHaveBeenCalledWith('rojo')
    expect(await res.json()).toEqual({ color: 'rojo', items: [resumenRojo] })
  })

  it('devuelve la asignación completa agrupada por color con colores por defecto', async () => {
    listarIntegrantesMock.mockImplementation(async (color: string) =>
      color === 'rojo' ? [resumenRojo] : []
    )

    const res = await app.request('/equipos', { method: 'GET' })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      asignacion: Record<string, string>
      porColor: Record<string, string[]>
      bloqueado: boolean
    }
    expect(body.asignacion).toEqual({ 'id-1': 'rojo' })
    expect(body.porColor['rojo']).toEqual(['id-1'])
    expect(body.porColor['azul']).toEqual([])
    expect(body.bloqueado).toBe(false)
  })

  it('usa los colores configurados en GET /equipos', async () => {
    obtenerConfigMock.mockResolvedValue({
      configId: 'equipos',
      bloqueado: true,
      colores: ['verde', 'negro']
    })
    listarIntegrantesMock.mockResolvedValue([])

    const res = await app.request('/equipos', { method: 'GET' })

    expect(res.status).toBe(200)
    expect(listarIntegrantesMock).toHaveBeenCalledWith('verde')
    expect(listarIntegrantesMock).toHaveBeenCalledWith('negro')
    expect(listarIntegrantesMock).not.toHaveBeenCalledWith('rojo')
    expect((await res.json()) as { bloqueado: boolean }).toMatchObject({ bloqueado: true })
  })
})