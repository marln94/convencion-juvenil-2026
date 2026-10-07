import type { RegistrarParticipanteOutput, SolicitarComprobanteUploadOutput } from '@convencion/shared-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.AUTH_BYPASS_DEV = 'true'
process.env.AUTH_BYPASS_ROL = 'admin'

const { crearParticipanteMock, firmarSubidaComprobanteMock, obtenerConfiguracionEquiposMock } =
  vi.hoisted(() => ({
    crearParticipanteMock: vi.fn(),
    firmarSubidaComprobanteMock: vi.fn(),
    obtenerConfiguracionEquiposMock: vi.fn()
  }))

vi.mock('../repos/participantes.js', () => ({
  crearParticipante: crearParticipanteMock,
  obtenerParticipante: vi.fn()
}))

vi.mock('../repos/configuracion.js', () => ({
  obtenerConfiguracionEquipos: obtenerConfiguracionEquiposMock
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
  contacto: '1122-3344',
  correo: 'ana@example.com',
  tipoRegistro: 'online',
  comprobante: { contentType: 'image/png', s3Key: 'comprobantes/anita.png' },
  localidad: 'Tegucigalpa',
  region: '1',
  edad: 25,
  diasAsistencia: ['jueves-24', 'viernes-25', 'sabado-26', 'domingo-27'],
  rol: 'joven'
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
  obtenerConfiguracionEquiposMock.mockReset()
  obtenerConfiguracionEquiposMock.mockResolvedValue(undefined)
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
  it('registra in situ con estado pagado, equipo asignado y checkIn', async () => {
    const res = await post('/inscripciones', {
      nombre: 'Leo García',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ',
      equipoColor: 'David',
      localidad: 'San Pedro Sula',
      region: '12',
      edad: 30,
      diasAsistencia: ['jueves-24'],
      rol: 'joven'
    })
    const body = (await res.json()) as RegistrarParticipanteOutput

    expect(res.status).toBe(201)
    expect(body.participante.estadoPago).toBe('pagado')
    expect(body.participante.tipoRegistro).toBe('in_situ')
    expect(body.participante.equipoColor).toBe('David')
    expect(body.participante.checkIn).toBe(true)
    expect(body.participante.checkInTimestamp).toBeDefined()
    expect(body.codigoQr).toBe(body.participante.participantId)
    expect(crearParticipanteMock).toHaveBeenCalledWith(
      expect.objectContaining({ equipoColor: 'David', checkIn: true })
    )
  })

  it('rechaza 400 si falta el equipo en el registro in situ', async () => {
    const res = await post('/inscripciones', {
      nombre: 'Leo García',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ',
      localidad: 'San Pedro Sula',
      region: '12',
      edad: 30,
      diasAsistencia: ['jueves-24'],
      rol: 'joven'
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El equipo es obligatorio para el registro in situ' })
    expect(crearParticipanteMock).not.toHaveBeenCalled()
  })

  it('rechaza 400 si el equipo no está en la lista activa', async () => {
    obtenerConfiguracionEquiposMock.mockResolvedValue({ configId: 'equipos', colores: ['David'] })

    const res = await post('/inscripciones', {
      nombre: 'Leo García',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ',
      equipoColor: 'Azul',
      localidad: 'San Pedro Sula',
      region: '12',
      edad: 30,
      diasAsistencia: ['jueves-24'],
      rol: 'joven'
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El equipo seleccionado no existe' })
    expect(crearParticipanteMock).not.toHaveBeenCalled()
  })

  it('respeta el participantId provisto para el in situ offline', async () => {
    const idFijo = 'a3f8c9d2-4e5b-4f6a-9b7c-1d2e3f4a5b6c'
    const res = await post('/inscripciones', {
      participantId: idFijo,
      nombre: 'Leo García',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ',
      equipoColor: 'Rut',
      localidad: 'San Pedro Sula',
      region: '12',
      edad: 30,
      diasAsistencia: ['jueves-24'],
      rol: 'joven'
    })
    const body = (await res.json()) as RegistrarParticipanteOutput

    expect(res.status).toBe(201)
    expect(body.participante.participantId).toBe(idFijo)
    expect(body.codigoQr).toBe(idFijo)
    expect(crearParticipanteMock).toHaveBeenCalledWith(
      expect.objectContaining({ participantId: idFijo })
    )
  })

  it('rechaza 400 si el participantId provisto no es un UUID', async () => {
    const res = await post('/inscripciones', {
      participantId: 'no-es-uuid',
      nombre: 'Leo García',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ',
      equipoColor: 'Rut',
      localidad: 'San Pedro Sula',
      region: '12',
      edad: 30,
      diasAsistencia: ['jueves-24'],
      rol: 'joven'
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El participantId es inválido' })
    expect(crearParticipanteMock).not.toHaveBeenCalled()
  })
})

describe('registro por encargado', () => {
  it('vincula los datos del encargado en el registro', async () => {
    const res = await post('/inscripciones', {
      ...onlineValido,
      esRegistroPorEncargado: true,
      encargadoNombre: 'María López',
      encargadoContacto: 'maria@example.com'
    })
    const body = (await res.json()) as RegistrarParticipanteOutput

    expect(res.status).toBe(201)
    expect(body.participante.encargadoNombre).toBe('María López')
    expect(body.participante.encargadoContacto).toBe('maria@example.com')
  })

  it('rechaza 400 con encargado incompleto', async () => {
    const res = await post('/inscripciones', {
      ...onlineValido,
      esRegistroPorEncargado: true,
      encargadoNombre: 'María López'
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

  it('acepta contacto opcional vacío', async () => {
    const res = await post('/inscripciones', { ...onlineValido, contacto: '' })
    expect(res.status).toBe(201)
  })

  it('rechaza contacto con formato inválido', async () => {
    const res = await post('/inscripciones', { ...onlineValido, contacto: 'invalido' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'El contacto debe ser un teléfono 8877-9955 o un correo válido' })
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

  it('rechaza sin localidad', async () => {
    const res = await post('/inscripciones', { ...onlineValido, localidad: '' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'La localidad es obligatoria' })
  })

  it('rechaza region inválida', async () => {
    const res = await post('/inscripciones', { ...onlineValido, region: '99' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Seleccioná una región válida' })
  })

  it('rechaza edad por debajo del mínimo', async () => {
    const res = await post('/inscripciones', { ...onlineValido, edad: 14 })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Edad no permitida' })
  })

  it('rechaza edad mayor a 99', async () => {
    const res = await post('/inscripciones', { ...onlineValido, edad: 100 })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Edad no permitida' })
  })

  it('rechaza edad decimal', async () => {
    const res = await post('/inscripciones', { ...onlineValido, edad: 25.5 })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Edad no permitida' })
  })

  it('acepta joven en el borde superior de la banda', async () => {
    const res = await post('/inscripciones', { ...onlineValido, rol: 'joven', edad: 30 })
    expect(res.status).toBe(201)
    expect(crearParticipanteMock).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'joven', edad: 30 })
    )
  })

  it('rechaza joven fuera de banda', async () => {
    const res = await post('/inscripciones', { ...onlineValido, rol: 'joven', edad: 32 })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Edad no permitida' })
  })

  it('acepta encargado con edad fuera de la banda de joven', async () => {
    const res = await post('/inscripciones', { ...onlineValido, rol: 'encargado', edad: 45 })
    expect(res.status).toBe(201)
    expect(crearParticipanteMock).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'encargado', edad: 45 })
    )
  })

  it('acepta encargado en el máximo del rango estándar', async () => {
    const res = await post('/inscripciones', { ...onlineValido, rol: 'encargado', edad: 99 })
    expect(res.status).toBe(201)
  })

  it('rechaza sin diasAsistencia', async () => {
    const res = await post('/inscripciones', { ...onlineValido, diasAsistencia: [] })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Seleccioná al menos un día de asistencia' })
  })

  it('rechaza rol inválido', async () => {
    const res = await post('/inscripciones', { ...onlineValido, rol: 'invalido' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Seleccioná un rol válido' })
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