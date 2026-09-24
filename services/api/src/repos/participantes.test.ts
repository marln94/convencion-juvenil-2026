import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import type { Participante } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }))

vi.mock('../lib/dynamo.js', () => ({
  TABLAS: { participantes: 'Convencion-Participantes', configuracion: 'Convencion-Configuracion' },
  getDocumentClient: () => ({ send: sendMock })
}))

import { crearParticipante, listarParticipantes, obtenerParticipante, listarPorEstadoPago, actualizarEstadoPago, listarIntegrantesDeEquipo, asignarEquipoColor } from './participantes.js'

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

describe('listarParticipantes', () => {
  const ana: Participante = {
    participantId: 'id-1',
    nombre: 'Ana Pérez',
    contacto: '+54 111',
    esRegistroPorEncargado: false,
    tipoRegistro: 'online',
    estadoPago: 'pendiente',
    comprobanteS3Key: 'comprobantes/a.png',
    checkIn: false,
    fechaRegistro: '2026-09-01T00:00:00.000Z'
  }
  const leo: Participante = {
    participantId: 'id-2',
    nombre: 'Leo García',
    contacto: '+54 222',
    esRegistroPorEncargado: false,
    tipoRegistro: 'in_situ',
    estadoPago: 'pagado',
    equipoColor: 'rojo',
    checkIn: true,
    checkInTimestamp: '2026-09-02T10:00:00.000Z',
    fechaRegistro: '2026-09-02T00:00:00.000Z'
  }

  beforeEach(() => {
    sendMock.mockReset()
  })

  it('usa Query sobre el GSI-EstadoPago cuando hay filtro de estado', async () => {
    sendMock.mockResolvedValueOnce({ Items: [ana], LastEvaluatedKey: undefined })

    const resultado = await listarParticipantes({ estadoPago: 'pendiente' })

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          IndexName: 'GSI-EstadoPago',
          KeyConditionExpression: 'estadoPago = :estadoPago',
          ExpressionAttributeValues: { ':estadoPago': 'pendiente' },
          ScanIndexForward: false
        })
      })
    )
    expect(resultado.items).toEqual([
      { participantId: 'id-1', nombre: 'Ana Pérez', estadoPago: 'pendiente', tipoRegistro: 'online', checkIn: false }
    ])
    expect(resultado.pagination.total).toBe(1)
    expect(resultado.pagination.nextToken).toBeUndefined()
  })

  it('usa Scan paginado cuando no hay filtro de estado', async () => {
    sendMock.mockResolvedValueOnce({ Items: [ana, leo] })

    const resultado = await listarParticipantes()

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ TableName: 'Convencion-Participantes' }) })
    )
    expect(sendMock.mock.calls[0]![0].constructor.name).toBe('ScanCommand')
    expect(resultado.items).toEqual([
      {
        participantId: 'id-1',
        nombre: 'Ana Pérez',
        estadoPago: 'pendiente',
        tipoRegistro: 'online',
        checkIn: false
      },
      {
        participantId: 'id-2',
        nombre: 'Leo García',
        estadoPago: 'pagado',
        tipoRegistro: 'in_situ',
        equipoColor: 'rojo',
        checkIn: true
      }
    ])
  })

  it('integra filtros adicionales en el FilterExpression', async () => {
    sendMock.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined })

    await listarParticipantes({ estadoPago: 'pendiente', tipoRegistro: 'online', checkIn: false })

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          FilterExpression: 'tipoRegistro = :tipoRegistro AND checkIn = :checkIn',
          ExpressionAttributeValues: {
            ':estadoPago': 'pendiente',
            ':tipoRegistro': 'online',
            ':checkIn': false
          }
        })
      })
    )
  })

  it('serializa LastEvaluatedKey como nextToken', async () => {
    const clave = { estadoPago: 'pendiente', fechaRegistro: '2026-09-01T00:00:00.000Z' }
    sendMock.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: clave })

    const resultado = await listarParticipantes({ estadoPago: 'pendiente' })

    expect(resultado.pagination.nextToken).toBe(JSON.stringify(clave))
  })

  it('acepta un nextToken JSON como ExclusiveStartKey', async () => {
    const clave = { estadoPago: 'pendiente', fechaRegistro: '2026-09-01T00:00:00.000Z' }
    sendMock.mockResolvedValueOnce({ Items: [] })

    await listarParticipantes({ estadoPago: 'pendiente', nextToken: JSON.stringify(clave) })

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ ExclusiveStartKey: clave })
      })
    )
  })

  it('aplica el límite máximo a valores altos', async () => {
    sendMock.mockResolvedValueOnce({ Items: [] })

    await listarParticipantes({ limit: 9999 })

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ Limit: 500 }) })
    )
  })
})

describe('listarPorEstadoPago', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('consulta el GSI-EstadoPago en orden inverso por fecha', async () => {
    sendMock.mockResolvedValueOnce({ Items: [participanteBase] })

    const resultado = await listarPorEstadoPago('pendiente')

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          IndexName: 'GSI-EstadoPago',
          KeyConditionExpression: 'estadoPago = :estadoPago',
          ExpressionAttributeValues: { ':estadoPago': 'pendiente' },
          ScanIndexForward: false
        })
      })
    )
    expect(resultado).toEqual([participanteBase])
  })

  it('devuelve lista vacía cuando no hay resultados', async () => {
    sendMock.mockResolvedValueOnce({ Items: undefined })

    await expect(listarPorEstadoPago('pagado')).resolves.toEqual([])
  })

  it('recorre todas las páginas de la Query', async () => {
    const clave = { estadoPago: 'pagado', fechaRegistro: '2026-09-01T00:00:00.000Z' }
    sendMock
      .mockResolvedValueOnce({ Items: [participanteBase], LastEvaluatedKey: clave })
      .mockResolvedValueOnce({ Items: [participanteBase] })

    const resultado = await listarPorEstadoPago('pagado')

    expect(sendMock).toHaveBeenCalledTimes(2)
    expect(resultado).toHaveLength(2)
  })
})

describe('actualizarEstadoPago', () => {
  const pagado = (p: Participante): Participante => ({
    ...p,
    estadoPago: 'pagado',
    revisadoEn: '2026-09-10T12:00:00.000Z'
  })

  beforeEach(() => {
    sendMock.mockReset()
  })

  it('aprueba un pendiente y borra el motivoRechazo previo', async () => {
    const rechazadoPrevio = { ...participanteBase, estadoPago: 'rechazado', motivoRechazo: 'ilegible' }
    const actualizado = pagado(participanteBase)

    sendMock
      .mockResolvedValueOnce({ Item: rechazadoPrevio })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: actualizado })

    const resultado = await actualizarEstadoPago('id-1', { estado: 'pagado' })

    expect(resultado).toEqual(actualizado)
    const llamadaUpdate = sendMock.mock.calls.find(([cmd]) => cmd.constructor.name === 'UpdateCommand')
    expect(llamadaUpdate).toBeDefined()
    const input = llamadaUpdate![0].input as { Key: Record<string, unknown>; UpdateExpression: string; ExpressionAttributeValues: Record<string, unknown> }
    expect(input.Key.participantId).toBe('id-1')
    expect(input.UpdateExpression).toBe('SET estadoPago = :estado, revisadoEn = :revisadoEn REMOVE motivoRechazo')
    expect(input.ExpressionAttributeValues[':estado']).toBe('pagado')
  })

  it('aprueba un rechazado (re-aprobación) conservando el participantId', async () => {
    const rechazado = { ...participanteBase, estadoPago: 'rechazado' }
    const actualizado = pagado(participanteBase)

    sendMock
      .mockResolvedValueOnce({ Item: rechazado })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: actualizado })

    const resultado = await actualizarEstadoPago('id-1', { estado: 'pagado' })

    expect(resultado?.participantId).toBe('id-1')
    expect(resultado?.estadoPago).toBe('pagado')
  })

  it('rechaza un pendiente guardando el motivo', async () => {
    const actualizado = {
      ...participanteBase,
      estadoPago: 'rechazado',
      revisadoEn: '2026-09-10T12:00:00.000Z',
      motivoRechazo: 'Comprobante ilegible'
    }

    sendMock
      .mockResolvedValueOnce({ Item: participanteBase })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: actualizado })

    const resultado = await actualizarEstadoPago('id-1', {
      estado: 'rechazado',
      motivoRechazo: 'Comprobante ilegible'
    })

    expect(resultado).toEqual(actualizado)
    const llamadaUpdate = sendMock.mock.calls.find(([cmd]) => cmd.constructor.name === 'UpdateCommand')
    const input = llamadaUpdate![0].input as { UpdateExpression: string; ExpressionAttributeValues: Record<string, unknown> }
    expect(input.UpdateExpression).toBe('SET estadoPago = :estado, revisadoEn = :revisadoEn, motivoRechazo = :motivo')
    expect(input.ExpressionAttributeValues[':motivo']).toBe('Comprobante ilegible')
  })

  it('rechaza a un pagado con 409 por transición inválida sin actualizar', async () => {
    sendMock.mockResolvedValueOnce({ Item: pagado(participanteBase) })

    await expect(actualizarEstadoPago('id-1', { estado: 'rechazado' })).rejects.toMatchObject({
      status: 409
    })
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('devuelve undefined cuando el participante no existe', async () => {
    sendMock.mockResolvedValueOnce({})

    await expect(actualizarEstadoPago('no-existe', { estado: 'pagado' })).resolves.toBeUndefined()
    expect(sendMock).toHaveBeenCalledTimes(1)
  })
})

describe('listarIntegrantesDeEquipo', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('consulta por color sobre el GSI-Equipo y resume los datos', async () => {
    const conEquipo = { ...participanteBase, equipoColor: 'rojo' }
    sendMock.mockResolvedValueOnce({ Items: [conEquipo] })

    const resultado = await listarIntegrantesDeEquipo('rojo')

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          IndexName: 'GSI-Equipo',
          KeyConditionExpression: 'equipoColor = :color',
          ExpressionAttributeValues: { ':color': 'rojo' },
          ScanIndexForward: false
        })
      })
    )
    expect(resultado).toEqual([
      { participantId: 'id-1', nombre: 'Ana', estadoPago: 'pendiente', tipoRegistro: 'online', equipoColor: 'rojo', checkIn: false }
    ])
  })

  it('recorre páginas hasta agotar la clave de continuación', async () => {
    const clave = { equipoColor: 'rojo', fechaRegistro: '2026-09-01T00:00:00.000Z' }
    sendMock
      .mockResolvedValueOnce({ Items: [participanteBase], LastEvaluatedKey: clave })
      .mockResolvedValueOnce({ Items: [participanteBase] })

    const resultado = await listarIntegrantesDeEquipo('rojo')

    expect(sendMock).toHaveBeenCalledTimes(2)
    expect(resultado).toHaveLength(2)
  })
})

describe('asignarEquipoColor', () => {
  const conEquipo = (id: string): { participante: typeof participanteBase; equipoColor: string } => ({
    participante: { ...participanteBase, participantId: id },
    equipoColor: 'rojo'
  })

  beforeEach(() => {
    sendMock.mockReset()
  })

  it('escribe en chunks de 25 ítems', async () => {
    const asignaciones = Array.from({ length: 30 }, (_, i) => conEquipo(`id-${i}`))
    sendMock.mockResolvedValue({})

    await asignarEquipoColor(asignaciones)

    const llamadasBatch = sendMock.mock.calls.filter(
      ([cmd]) => cmd.constructor.name === 'BatchWriteCommand'
    )
    expect(llamadasBatch).toHaveLength(2)
    const primera = llamadasBatch[0]![0].input as { RequestItems: Record<string, unknown[]> }
    const segunda = llamadasBatch[1]![0].input as { RequestItems: Record<string, unknown[]> }
    expect(primera.RequestItems['Convencion-Participantes']).toHaveLength(25)
    expect(segunda.RequestItems['Convencion-Participantes']).toHaveLength(5)
  })

  it('escribe el equipoColor en cada ítem', async () => {
    sendMock.mockResolvedValueOnce({})

    await asignarEquipoColor([conEquipo('id-1')])

    const llamada = sendMock.mock.calls.find(([cmd]) => cmd.constructor.name === 'BatchWriteCommand')
    const input = llamada![0].input as { RequestItems: Record<string, { PutRequest: { Item: Record<string, unknown> } }[]> }
    const item = input.RequestItems['Convencion-Participantes']![0]!.PutRequest.Item
    expect(item.participantId).toBe('id-1')
    expect(item.equipoColor).toBe('rojo')
  })

  it('reintenta los ítems no procesados', async () => {
    const asignacion = conEquipo('id-1')
    sendMock
      .mockResolvedValueOnce({
        UnprocessedItems: {
          'Convencion-Participantes': [{ PutRequest: { Item: asignacion.participante } }]
        }
      })
      .mockResolvedValueOnce({})

    await asignarEquipoColor([asignacion])

    expect(sendMock.mock.calls.filter(([cmd]) => cmd.constructor.name === 'BatchWriteCommand')).toHaveLength(2)
  })

  it('lanza 500 si quedan ítems sin procesar tras los reintentos', async () => {
    const asignacion = conEquipo('id-1')
    sendMock.mockResolvedValue({
      UnprocessedItems: {
        'Convencion-Participantes': [{ PutRequest: { Item: asignacion.participante } }]
      }
    })

    await expect(asignarEquipoColor([asignacion])).rejects.toMatchObject({ status: 500 })
    expect(sendMock.mock.calls.filter(([cmd]) => cmd.constructor.name === 'BatchWriteCommand')).toHaveLength(3)
  })
})