import type { Participante } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.AUTH_BYPASS_DEV = 'true'
process.env.AUTH_BYPASS_ROL = 'admin'

const { obtenerParticipanteMock, marcarCheckInMock } = vi.hoisted(() => ({
  obtenerParticipanteMock: vi.fn(),
  marcarCheckInMock: vi.fn()
}))

vi.mock('../repos/participantes.js', () => ({
  obtenerParticipante: obtenerParticipanteMock,
  marcarCheckIn: marcarCheckInMock
}))

import { Hono } from 'hono'

import app from './checkin.js'

const appMontado = new Hono()
appMontado.route('/checkin', app)

const participanteBase: Participante = {
  participantId: 'id-1',
  nombre: 'Ana Perez',
  contacto: '8877-1122',
  localidad: 'Tegucigalpa',
  region: '1',
  edad: 25,
  diasAsistencia: ['jueves-24'],
  rol: 'joven',
  esRegistroPorEncargado: false,
  tipoRegistro: 'online',
  estadoPago: 'pendiente',
  comprobanteS3Key: 'comprobantes/id-1.png',
  checkIn: false,
  fechaRegistro: '2026-09-01T00:00:00.000Z'
}

function hacerPost(cuerpo: unknown): Response | Promise<Response> {
  return appMontado.request('/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo)
  })
}

beforeEach(() => {
  obtenerParticipanteMock.mockReset()
  marcarCheckInMock.mockReset()
})

describe('POST /checkin', () => {
  it('registra la llegada y devuelve el participante con estado constatado', async () => {
    obtenerParticipanteMock.mockResolvedValue(participanteBase)
    marcarCheckInMock.mockResolvedValue('2026-09-10T10:00:00.000Z')

    const res = await hacerPost({ participantId: 'id-1' })

    expect(res.status).toBe(200)
    expect(obtenerParticipanteMock).toHaveBeenCalledWith('id-1')
    expect(marcarCheckInMock).toHaveBeenCalledWith('id-1')
    const body = (await res.json()) as { participante: Participante }
    expect(body.participante.checkIn).toBe(true)
    expect(body.participante.checkInTimestamp).toBe('2026-09-10T10:00:00.000Z')
    expect(body).not.toHaveProperty('accesoPermitido')
  })

  it('conserva la llegada original en un check-in repetido', async () => {
    obtenerParticipanteMock.mockResolvedValue({
      ...participanteBase,
      checkIn: true,
      checkInTimestamp: '2026-09-10T09:00:00.000Z'
    })
    marcarCheckInMock.mockResolvedValue('2026-09-10T18:00:00.000Z')

    const res = await hacerPost({ participantId: 'id-1' })

    const body = (await res.json()) as { participante: Participante }
    expect(body.participante.checkIn).toBe(true)
    expect(body.participante.checkInTimestamp).toBe('2026-09-10T09:00:00.000Z')
  })

  it('responde 404 si el participante no existe', async () => {
    obtenerParticipanteMock.mockResolvedValue(undefined)

    const res = await hacerPost({ participantId: 'desconocido' })

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      message: 'El código no corresponde a un participante'
    })
    expect(marcarCheckInMock).not.toHaveBeenCalled()
  })

  it('responde 400 si falta el participantId', async () => {
    const res = await hacerPost({})

    expect(res.status).toBe(400)
    expect(obtenerParticipanteMock).not.toHaveBeenCalled()
  })
})