import type { RegistrarParticipanteOutput, SolicitarComprobanteUploadOutput } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { crearParticipanteMock, firmarSubidaComprobanteMock } = vi.hoisted(() => ({
  crearParticipanteMock: vi.fn(),
  firmarSubidaComprobanteMock: vi.fn()
}))

vi.mock('../repos/participantes.js', () => ({
  crearParticipante: crearParticipanteMock,
  obtenerParticipante: vi.fn()
}))

vi.mock('../lib/comprobante.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/comprobante.js')>()
  return { ...original, firmarSubidaComprobante: firmarSubidaComprobanteMock }
})

import app from './registro.js'

async function post(path: string, body: unknown): Promise<Response> {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

const onlineValido = {
  nombre: 'Ana Pérez',
  contacto: '+54 111 222 3333',
  correo: 'ana@example.com',
  tipoRegistro: 'online',
  comprobante: { contentType: 'image/png', s3Key: 'comprobantes/anita.png' }
}

beforeEach(() => {
  crearParticipanteMock.mockReset()
  crearParticipanteMock.mockResolvedValue(undefined)
  firmarSubidaComprobanteMock.mockReset()
  firmarSubidaComprobanteMock.mockResolvedValue({
    uploadUrl: 'https://bucket.s3.amazonaws.com/comprobantes/x.png?X-Amz-Signature=abc',
    s3Key: 'comprobantes/x.png',
    contentType: 'image/png'
  })
})

describe('POST /inscripciones (online)', () => {
  it('registra online con estado pendiente y devuelve codigoQr', async () => {
    const res = await post('/inscripciones', onlineValido)
    const body = (await res.json()) as RegistrarParticipanteOutput

    expect(res.status).toBe(201)
    expect(body.participante.estadoPago).toBe('pendiente')
    expect(body.participante.tipoRegistro).toBe('online')
    expect(body.participante.correo).toBe('ana@example.com')
    expect(body.participante.comprobanteS3Key).toBe('comprobantes/anita.png')
    expect(body.codigoQr).toBe(body.participante.participantId)
    expect(crearParticipanteMock).toHaveBeenCalledWith(
      expect.objectContaining({ estadoPago: 'pendiente' })
    )
  })

  it('rechaza 400 si falta el comprobante', async () => {
    const { comprobante: _omitido, ...sinComprobante } = onlineValido
    const res = await post('/inscripciones', sinComprobante)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El comprobante de pago es obligatorio' })
    expect(crearParticipanteMock).not.toHaveBeenCalled()
  })
})

describe('POST /inscripciones (in situ)', () => {
  it('registra in situ con estado pagado sin comprobante', async () => {
    const res = await post('/inscripciones', {
      nombre: 'Leo',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ'
    })
    const body = (await res.json()) as RegistrarParticipanteOutput

    expect(res.status).toBe(201)
    expect(body.participante.estadoPago).toBe('pagado')
    expect(body.participante.tipoRegistro).toBe('in_situ')
    expect(body.codigoQr).toBe(body.participante.participantId)
  })
})

describe('registro por encargado', () => {
  it('vincula los datos del encargado en el registro', async () => {
    const res = await post('/inscripciones', {
      ...onlineValido,
      esRegistroPorEncargado: true,
      encargadoNombre: 'María',
      encargadoContacto: 'maria@example.com'
    })
    const body = (await res.json()) as RegistrarParticipanteOutput

    expect(res.status).toBe(201)
    expect(body.participante.encargadoNombre).toBe('María')
    expect(body.participante.encargadoContacto).toBe('maria@example.com')
  })

  it('rechaza 400 con encargado incompleto', async () => {
    const res = await post('/inscripciones', {
      ...onlineValido,
      esRegistroPorEncargado: true,
      encargadoNombre: 'María'
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Los datos del encargado son obligatorios' })
    expect(crearParticipanteMock).not.toHaveBeenCalled()
  })
})

describe('validaciones de datos', () => {
  it('rechaza sin nombre', async () => {
    const res = await post('/inscripciones', { ...onlineValido, nombre: '' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El nombre es obligatorio' })
  })

  it('rechaza sin contacto', async () => {
    const res = await post('/inscripciones', { ...onlineValido, contacto: '' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El contacto es obligatorio' })
  })

  it('rechaza tipo de registro inválido', async () => {
    const res = await post('/inscripciones', { ...onlineValido, tipoRegistro: 'otro' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El tipo de registro es inválido' })
  })

  it('rechaza correo inválido', async () => {
    const res = await post('/inscripciones', { ...onlineValido, correo: 'no-es-correo' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El correo es inválido' })
  })

  it('mapea la colisión de participantId a 409', async () => {
    const { HttpError } = await import('../lib/http-error.js')
    crearParticipanteMock.mockRejectedValueOnce(new HttpError(409, 'El participante ya existe'))

    const res = await post('/inscripciones', onlineValido)

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ message: 'El participante ya existe' })
  })
})

describe('POST /inscripciones/comprobante-upload', () => {
  it('devuelve la URL firmada para un tipo permitido', async () => {
    const res = await post('/inscripciones/comprobante-upload', {
      contentType: 'image/png',
      nombreArchivo: 'comprobante.png'
    })
    const body = (await res.json()) as SolicitarComprobanteUploadOutput

    expect(res.status).toBe(200)
    expect(body.uploadUrl).toContain('X-Amz-Signature')
    expect(body.s3Key).toBe('comprobantes/x.png')
    expect(body.contentType).toBe('image/png')
    expect(body.expiraEnSegundos).toBeGreaterThan(0)
    expect(firmarSubidaComprobanteMock).toHaveBeenCalledWith('image/png')
  })

  it('rechaza 400 para un tipo no permitido', async () => {
    const res = await post('/inscripciones/comprobante-upload', { contentType: 'image/gif' })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El tipo de archivo no está permitido' })
    expect(firmarSubidaComprobanteMock).not.toHaveBeenCalled()
  })
})