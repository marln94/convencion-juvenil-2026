import type { Participante } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.AUTH_BYPASS_DEV = 'true'
process.env.AUTH_BYPASS_ROL = 'admin'

const { listarPorEstadoPagoMock, actualizarEstadoPagoMock, firmarLecturaMock } = vi.hoisted(() => ({
  listarPorEstadoPagoMock: vi.fn(),
  actualizarEstadoPagoMock: vi.fn(),
  firmarLecturaMock: vi.fn()
}))

vi.mock('../repos/participantes.js', () => ({
  crearParticipante: vi.fn(),
  obtenerParticipante: vi.fn(),
  listarParticipantes: vi.fn(),
  listarPorEstadoPago: listarPorEstadoPagoMock,
  actualizarEstadoPago: actualizarEstadoPagoMock
}))
vi.mock('../lib/comprobante.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/comprobante.js')>()
  return { ...actual, firmarLecturaComprobante: firmarLecturaMock }
})

import { HttpError } from '../lib/http-error.js'
import app from './revisar-pago.js'

const conComprobante: Participante = {
  participantId: 'id-1',
  nombre: 'Ana Pérez',
  contacto: '8877-1122',
  correo: 'ana@example.com',
  esRegistroPorEncargado: false,
  tipoRegistro: 'online',
  estadoPago: 'pendiente',
  comprobanteS3Key: 'comprobantes/a.png',
  checkIn: false,
  fechaRegistro: '2026-09-01T00:00:00.000Z'
}

const sinComprobante: Participante = {
  participantId: 'id-2',
  nombre: 'Leo García',
  contacto: '8877-3344',
  esRegistroPorEncargado: false,
  tipoRegistro: 'in_situ',
  estadoPago: 'pendiente',
  checkIn: false,
  fechaRegistro: '2026-09-02T00:00:00.000Z'
}

function cuerpoRevisar(parcial: Record<string, unknown>): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parcial)
  }
}

beforeEach(() => {
  listarPorEstadoPagoMock.mockReset()
  actualizarEstadoPagoMock.mockReset()
  firmarLecturaMock.mockReset()
  firmarLecturaMock.mockResolvedValue('https://s3.example.test/comprobantes/a.png?X-Amz-Signature=abc')
})

describe('GET /pagos/:estado', () => {
  it('devuelve la bandeja de pendientes con URL firmada solo cuando hay comprobante', async () => {
    listarPorEstadoPagoMock.mockResolvedValueOnce([conComprobante, sinComprobante])

    const res = await app.request('/pagos/pendiente', { method: 'GET' })

    expect(res.status).toBe(200)
    expect(listarPorEstadoPagoMock).toHaveBeenCalledWith('pendiente')
    expect(firmarLecturaMock).toHaveBeenCalledWith('comprobantes/a.png')
    const body = (await res.json()) as { items: { tieneComprobante: boolean; vistaComprobanteUrl?: string }[] }
    expect(body.items).toHaveLength(2)
    expect(body.items[0]).toMatchObject({
      participantId: 'id-1',
      nombre: 'Ana Pérez',
      estadoPago: 'pendiente',
      tieneComprobante: true,
      vistaComprobanteUrl: 'https://s3.example.test/comprobantes/a.png?X-Amz-Signature=abc'
    })
    expect(body.items[1]).toMatchObject({
      participantId: 'id-2',
      tieneComprobante: false
    })
    expect(body.items[1]).not.toHaveProperty('vistaComprobanteUrl')
  })

  it('filtra por otro estado (pagado)', async () => {
    listarPorEstadoPagoMock.mockResolvedValueOnce([])

    const res = await app.request('/pagos/pagado', { method: 'GET' })

    expect(res.status).toBe(200)
    expect(listarPorEstadoPagoMock).toHaveBeenCalledWith('pagado')
  })

  it('responde 400 con un estado inválido', async () => {
    const res = await app.request('/pagos/inexistente', { method: 'GET' })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El estado de pago es inválido' })
    expect(listarPorEstadoPagoMock).not.toHaveBeenCalled()
  })
})

describe('POST /pagos/revisar', () => {
  const actualizado = (estado: Participante['estadoPago'], extras: Partial<Participante> = {}): Participante => ({
    ...conComprobante,
    estadoPago: estado,
    revisadoEn: '2026-09-10T12:00:00.000Z',
    ...extras
  })

  it('aprueba un comprobante y devuelve la constancia con revisadoEn', async () => {
    actualizarEstadoPagoMock.mockResolvedValueOnce(actualizado('pagado'))

    const res = await app.request('/pagos/revisar', cuerpoRevisar({ participantId: 'id-1', decision: 'aprobar' }))

    expect(res.status).toBe(200)
    expect(actualizarEstadoPagoMock).toHaveBeenCalledWith('id-1', {
      estado: 'pagado',
      motivoRechazo: undefined
    })
    const body = (await res.json()) as { participante: Participante; revisadoEn: string }
    expect(body.participante.estadoPago).toBe('pagado')
    expect(body.revisadoEn).toBe('2026-09-10T12:00:00.000Z')
  })

  it('aprueba de nuevo un comprobante rechazado (re-aprobación)', async () => {
    actualizarEstadoPagoMock.mockResolvedValueOnce(
      actualizado('pagado', { motivoRechazo: undefined, revisadoEn: '2026-09-11T00:00:00.000Z' })
    )

    const res = await app.request('/pagos/revisar', cuerpoRevisar({ participantId: 'id-1', decision: 'aprobar' }))

    expect(res.status).toBe(200)
    const body = (await res.json()) as { participante: Participante }
    expect(body.participante.participantId).toBe('id-1')
    expect(body.participante.estadoPago).toBe('pagado')
  })

  it('rechaza con motivo y deja constancia del motivo', async () => {
    actualizarEstadoPagoMock.mockResolvedValueOnce(
      actualizado('rechazado', { motivoRechazo: 'Comprobante ilegible' })
    )

    const res = await app.request(
      '/pagos/revisar',
      cuerpoRevisar({ participantId: 'id-1', decision: 'rechazar', motivoRechazo: 'Comprobante ilegible' })
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { motivoRechazo?: string }
    expect(body.motivoRechazo).toBe('Comprobante ilegible')
  })

  it('rechaza sin comprobante o sin correo sin errores', async () => {
    const sinCorreo = { ...sinComprobante, estadoPago: 'rechazado', revisadoEn: '2026-09-10T12:00:00.000Z' }
    actualizarEstadoPagoMock.mockResolvedValueOnce(sinCorreo)

    const res = await app.request('/pagos/revisar', cuerpoRevisar({ participantId: 'id-2', decision: 'rechazar' }))

    expect(res.status).toBe(200)
  })

  it('responde 404 si el participante no existe', async () => {
    actualizarEstadoPagoMock.mockResolvedValueOnce(undefined)

    const res = await app.request('/pagos/revisar', cuerpoRevisar({ participantId: 'desconocido', decision: 'aprobar' }))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ message: 'El participante no existe' })
  })

  it('responde 409 ante una transición inválida', async () => {
    actualizarEstadoPagoMock.mockRejectedValueOnce(
      new HttpError(409, 'Transición de estado inválida: el comprobante ya fue revisado')
    )

    const res = await app.request('/pagos/revisar', cuerpoRevisar({ participantId: 'id-1', decision: 'rechazar' }))

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      message: 'Transición de estado inválida: el comprobante ya fue revisado'
    })
  })

  it('responde 400 con decisión inválida', async () => {
    const res = await app.request('/pagos/revisar', cuerpoRevisar({ participantId: 'id-1', decision: 'borrar' }))

    expect(res.status).toBe(400)
    expect(actualizarEstadoPagoMock).not.toHaveBeenCalled()
    expect(await res.json()).toEqual({ message: 'La decisión es inválida' })
  })
})