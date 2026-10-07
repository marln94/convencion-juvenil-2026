import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }))

vi.mock('../lib/dynamo.js', () => ({
  TABLAS: { participantes: 'Convencion-Participantes', configuracion: 'Convencion-Configuracion' },
  getDocumentClient: () => ({ send: sendMock })
}))

import { actualizarColores, obtenerConfiguracionEquipos } from './configuracion.js'

beforeEach(() => {
  sendMock.mockReset()
})

describe('obtenerConfiguracionEquipos', () => {
  it('lee la fila de configuración sobre la clave "equipos"', async () => {
    sendMock.mockResolvedValueOnce({
      Item: { clave: 'equipos', colores: ['Daniel', 'Rut'] }
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
      colores: ['Daniel', 'Rut']
    })
  })

  it('devuelve undefined si no existe la fila', async () => {
    sendMock.mockResolvedValueOnce({})

    await expect(obtenerConfiguracionEquipos()).resolves.toBeUndefined()
  })

  it('aplica valores por defecto a fila incompleta', async () => {
    sendMock.mockResolvedValueOnce({ Item: { clave: 'equipos' } })

    const config = await obtenerConfiguracionEquipos()

    expect(config).toEqual({ configId: 'equipos', colores: [] })
  })
})

describe('actualizarColores', () => {
  it('persiste la lista de colores y devuelve la configuración actualizada', async () => {
    sendMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Item: { clave: 'equipos', colores: ['Daniel', 'Rut'] }
      })

    const config = await actualizarColores(['Daniel', 'Rut'])

    expect(config.colores).toEqual(['Daniel', 'Rut'])
    const llamadaUpdate = sendMock.mock.calls.find(([cmd]) => cmd.constructor.name === 'UpdateCommand')
    const input = llamadaUpdate![0].input as {
      UpdateExpression: string
      ExpressionAttributeValues: Record<string, unknown>
    }
    expect(input.UpdateExpression).toBe('SET colores = :colores')
    expect(input.ExpressionAttributeValues[':colores']).toEqual(['Daniel', 'Rut'])
  })
})