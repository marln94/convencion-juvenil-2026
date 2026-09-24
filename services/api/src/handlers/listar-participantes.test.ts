import type { Participante } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.AUTH_BYPASS_DEV = 'true'
process.env.AUTH_BYPASS_ROL = 'admin'

const { listarMock, obtenerMock } = vi.hoisted(() => ({
  listarMock: vi.fn(),
  obtenerMock: vi.fn()
}))

vi.mock('../repos/participantes.js', () => ({
  crearParticipante: vi.fn(),
  obtenerParticipante: obtenerMock,
  listarParticipantes: listarMock
}))

import app from './listar-participantes.js'

const participante: Participante = {
  participantId: 'id-1',
  nombre: 'Ana Pérez',
  contacto: '8877-1122',
  correo: 'ana@example.com',
  localidad: 'Tegucigalpa',
  region: '1',
  edad: 25,
  diasAsistencia: ['jueves-24'],
  rol: 'joven',
  esRegistroPorEncargado: false,
  tipoRegistro: 'online',
  estadoPago: 'pendiente',
  comprobanteS3Key: 'comprobantes/a.png',
  checkIn: false,
  fechaRegistro: '2026-09-01T00:00:00.000Z'
}

async function get(path: string): Promise<Response> {
  return app.request(path, { method: 'GET' })
}

beforeEach(() => {
  listarMock.mockReset()
  obtenerMock.mockReset()
  listarMock.mockResolvedValue({
    items: [
      {
        participantId: 'id-1',
        nombre: 'Ana Pérez',
        estadoPago: 'pendiente',
        checkIn: false
      }
    ],
    pagination: { total: 1 }
  })
})

describe('GET /inscripciones', () => {
  it('lista sin filtros en orden y con paginación', async () => {
    const res = await get('/inscripciones')

    expect(res.status).toBe(200)
    expect(listarMock).toHaveBeenCalledWith({ estadoPago: undefined, tipoRegistro: undefined, checkIn: undefined, limit: undefined, nextToken: undefined })
    const body = (await res.json()) as { items: unknown[]; pagination: { total: number } }
    expect(body.items).toHaveLength(1)
    expect(body.pagination.total).toBe(1)
  })

  it('pasa los filtros del query al repositorio', async () => {
    await get('/inscripciones?estadoPago=pagado&tipoRegistro=in_situ&checkIn=true&limit=25&nextToken=next-1')

    expect(listarMock).toHaveBeenCalledWith({
      estadoPago: 'pagado',
      tipoRegistro: 'in_situ',
      checkIn: true,
      limit: 25,
      nextToken: 'next-1'
    })
  })

  it('devuelve las páginas siguientes con nextToken', async () => {
    listarMock.mockResolvedValueOnce({
      items: [],
      pagination: { nextToken: 'pagina-2', total: 0 }
    })

    const res = await get('/inscripciones?nextToken=pagina-1')
    expect(res.status).toBe(200)
    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({ nextToken: 'pagina-1' })
    )
  })

  it('rechaza 400 con estado de pago inválido', async () => {
    const res = await get('/inscripciones?estadoPago=marzo')
    expect(res.status).toBe(400)
    expect(listarMock).not.toHaveBeenCalled()
  })

  it('rechaza 400 con tipo de registro inválido', async () => {
    const res = await get('/inscripciones?tipoRegistro=telefono')
    expect(res.status).toBe(400)
  })

  it('rechaza 400 si checkIn no es booleano', async () => {
    const res = await get('/inscripciones?checkIn=si')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'checkIn debe ser true o false' })
  })

  it('rechaza 400 si limit no es un entero válido', async () => {
    const res = await get('/inscripciones?limit=0')
    expect(res.status).toBe(400)
  })
})

describe('GET /inscripciones/:id', () => {
  it('devuelve el participante completo cuando existe', async () => {
    obtenerMock.mockResolvedValueOnce(participante)

    const res = await get('/inscripciones/id-1')

    expect(res.status).toBe(200)
    expect(obtenerMock).toHaveBeenCalledWith('id-1')
    const body = (await res.json()) as { participante: Participante }
    expect(body.participante).toEqual(participante)
  })

  it('responde 404 cuando no existe', async () => {
    obtenerMock.mockResolvedValueOnce(undefined)

    const res = await get('/inscripciones/desconocido')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ message: 'El participante no existe' })
  })
})