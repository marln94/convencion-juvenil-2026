import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }))

vi.mock('../lib/dynamo.js', () => ({
  TABLAS: { participantes: 'Convencion-Participantes', configuracion: 'Convencion-Configuracion' },
  getDocumentClient: () => ({ send: sendMock })
}))

import {
  actualizarColores,
  bloquearEquipos,
  obtenerConfiguracionEquipos,
  reclamarGeneracion
} from './configuracion.js'

beforeEach(() => {
  sendMock.mockReset()
})

describe('obtenerConfiguracionEquipos', () => {
  it('lee la fila de configuración sobre la clave "equipos"', async () => {
    sendMock.mockResolvedValueOnce({
      Item: { clave: 'equipos', bloqueado: true, colores: ['rojo', 'azul'], fechaGeneracion: '2026-09-10T00:00:00.000Z' }
    })

    const config = await obtenerConfiguracionEquipos()

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          TableName: 'Convencion-Configuracion',
          Key: { clave: 'equipos' }
        })
      })
    )
    expect(config).toEqual({
      configId: 'equipos',
      bloqueado: true,
      colores: ['rojo', 'azul'],
      fechaGeneracion: '2026-09-10T00:00:00.000Z'
    })
  })

  it('devuelve undefined si no existe la fila', async () => {
    sendMock.mockResolvedValueOnce({})

    await expect(obtenerConfiguracionEquipos()).resolves.toBeUndefined()
  })

  it('aplica valores por defecto a fila incompleta', async () => {
    sendMock.mockResolvedValueOnce({ Item: { clave: 'equipos' } })

    const config = await obtenerConfiguracionEquipos()

    expect(config).toEqual({ configId: 'equipos', bloqueado: false, colores: [] })
  })
})

describe('bloquearEquipos', () => {
  it('marca bloqueado como true con fecha de generación', async () => {
    sendMock.mockResolvedValueOnce({})

    const bloqueo = await bloquearEquipos()

    expect(bloqueo.bloqueado).toBe(true)
    expect(typeof bloqueo.fechaGeneracion).toBe('string')
    const llamadaUpdate = sendMock.mock.calls.find(([cmd]) => cmd.constructor.name === 'UpdateCommand')
    const input = llamadaUpdate![0].input as {
      Key: Record<string, unknown>
      UpdateExpression: string
      ExpressionAttributeValues: Record<string, unknown>
    }
    expect(input.Key).toEqual({ clave: 'equipos' })
    expect(input.UpdateExpression).toBe('SET bloqueado = :verdadero, fechaGeneracion = :fecha')
    expect(input.ExpressionAttributeValues[':verdadero']).toBe(true)
  })

  it('es idempotente: vuelve a marcar bloqueado tras una llamada previa', async () => {
    sendMock.mockResolvedValueOnce({})

    const primera = await bloquearEquipos()
    const segunda = await bloquearEquipos()

    expect(primera.bloqueado).toBe(true)
    expect(segunda.bloqueado).toBe(true)
  })
})

describe('actualizarColores', () => {
  it('persiste la lista de colores y devuelve la configuración actualizada', async () => {
    sendMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Item: { clave: 'equipos', colores: ['verde', 'negro'], bloqueado: true }
      })

    const config = await actualizarColores(['verde', 'negro'])

    expect(config.colores).toEqual(['verde', 'negro'])
    const llamadaUpdate = sendMock.mock.calls.find(([cmd]) => cmd.constructor.name === 'UpdateCommand')
    const input = llamadaUpdate![0].input as {
      UpdateExpression: string
      ExpressionAttributeValues: Record<string, unknown>
    }
    expect(input.UpdateExpression).toBe('SET colores = :colores')
    expect(input.ExpressionAttributeValues[':colores']).toEqual(['verde', 'negro'])
  })
})

describe('reclamarGeneracion', () => {
  it('registra la fecha con condición de no bloqueado', async () => {
    sendMock.mockResolvedValueOnce({})

    const fecha = await reclamarGeneracion()

    expect(typeof fecha).toBe('string')
    const llamadaUpdate = sendMock.mock.calls.find(([cmd]) => cmd.constructor.name === 'UpdateCommand')
    const input = llamadaUpdate![0].input as { ConditionExpression: string }
    expect(input.ConditionExpression).toBe(
      'attribute_not_exists(bloqueado) OR bloqueado <> :verdadero'
    )
  })

  it('responde 409 cuando la condición falla (asignación bloqueada)', async () => {
    const condicion = Object.create(ConditionalCheckFailedException.prototype)
    Object.assign(condicion, { $metadata: {}, message: 'condición' })
    sendMock.mockRejectedValueOnce(condicion)

    await expect(reclamarGeneracion()).rejects.toMatchObject({
      status: 409,
      message: 'La asignación de equipos está bloqueada'
    })
  })
})