import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import type { Participante } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }))

vi.mock('../lib/dynamo.js', () => ({
  TABLAS: { participantes: 'Convencion-Participantes', configuracion: 'Convencion-Configuracion' },
  getDocumentClient: () => ({ send: sendMock })
}))

import { crearParticipante, obtenerParticipante } from './participantes.js'

const participanteBase: Participante = {
  participantId: 'id-1',
  nombre: 'Ana',
  contacto: '+54 111',
  esRegistroPorEncargado: false,
  tipoRegistro: 'online',
  estadoPago: 'pendiente',
  comprobanteS3Key: 'comprobantes/a.png',
  checkIn: false,
  fechaRegistro: '2026-09-01T00:00:00.000Z'
}

describe('crearParticipante', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('guarda con condición de unicidad sobre participantId', async () => {
    sendMock.mockResolvedValueOnce({})

    await crearParticipante(participanteBase)

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          TableName: 'Convencion-Participantes',
          Item: participanteBase,
          ConditionExpression: 'attribute_not_exists(participantId)'
        })
      })
    )
  })

  it('mapea una colisión a HttpError 409', async () => {
    const colision = Object.create(ConditionalCheckFailedException.prototype)
    Object.assign(colision, { $metadata: {}, message: 'crash' })
    sendMock.mockRejectedValueOnce(colision)

    await expect(crearParticipante(participanteBase)).rejects.toMatchObject({ status: 409 })
  })

  it('repropaga errores que no son de condición', async () => {
    sendMock.mockRejectedValueOnce(new Error('red'))
    await expect(crearParticipante(participanteBase)).rejects.toThrow('red')
  })
})

describe('obtenerParticipante', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('devuelve el participante cuando existe', async () => {
    sendMock.mockResolvedValueOnce({ Item: participanteBase })

    const resultado = await obtenerParticipante('id-1')

    expect(resultado).toEqual(participanteBase)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          TableName: 'Convencion-Participantes',
          Key: { participantId: 'id-1' }
        })
      })
    )
  })

  it('devuelve undefined cuando no existe', async () => {
    sendMock.mockResolvedValueOnce({})
    await expect(obtenerParticipante('no-existe')).resolves.toBeUndefined()
  })
})