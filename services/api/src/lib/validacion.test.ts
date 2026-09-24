import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { primerErrorLegible, registrarParticipanteSchema, solicitarComprobanteUploadSchema } from './validacion.js'

const base = {
  nombre: 'Ana Pérez',
  contacto: '1122-3344',
  tipoRegistro: 'online',
  localidad: 'Tegucigalpa',
  region: '1',
  edad: 25,
  diasAsistencia: ['jueves-24', 'viernes-25', 'sabado-26', 'domingo-27'],
  rol: 'joven' as const
}

function legible(payload: unknown): string {
  const resultado = registrarParticipanteSchema.safeParse(payload)
  if (resultado.success) {
    throw new Error('La validación debió fallar')
  }
  return primerErrorLegible(resultado.error)
}

describe('registrarParticipanteSchema', () => {
  it('acepta un registro online con comprobante, teléfono de 8 dígitos y correo opcional', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      correo: 'ana@example.com',
      comprobante: { contentType: 'image/png', s3Key: 'comprobantes/a.png' }
    })
    expect(resultado.success).toBe(true)
    expect(resultado.success && resultado.data.nombre).toBe('Ana Pérez')
    expect(resultado.success && resultado.data.contacto).toBe('1122-3344')
  })

  it('acepta un contacto que es un correo válido', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      contacto: 'ana@example.com',
      comprobante: { contentType: 'image/png', s3Key: 'comprobantes/a.png' }
    })
    expect(resultado.success).toBe(true)
  })

  it('rechaza registro sin nombre', () => {
    expect(legible({ ...base, nombre: '' })).toBe('El nombre es obligatorio')
  })

  it('rechaza registro con nombre que contiene números', () => {
    expect(legible({ ...base, nombre: 'Ana 2' })).toBe('El nombre no puede contener números')
  })

  it('rechaza registro con nombre sin apellido', () => {
    expect(legible({ ...base, nombre: 'Ana' })).toBe(
      'El nombre debe incluir nombre y apellido'
    )
  })

  it('acepta contacto opcional vacío', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      contacto: '',
      comprobante: { contentType: 'image/png', s3Key: 'comprobantes/a.png' }
    })
    expect(resultado.success).toBe(true)
  })

  it('rechaza contacto con formato inválido', () => {
    expect(legible({ ...base, contacto: 'invalido' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
  })

  it('rechaza contacto con menos de 8 dígitos', () => {
    expect(legible({ ...base, contacto: '1122-334' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
  })

  it('rechaza contacto con más de 8 dígitos', () => {
    expect(legible({ ...base, contacto: '1122-33445' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
  })

  it('rechaza contacto numérico sin guion o con separadores inválidos', () => {
    expect(legible({ ...base, contacto: '11223344' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
    expect(legible({ ...base, contacto: '1122 3344' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
    expect(legible({ ...base, contacto: '1122-33 44' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
  })

  it('rechaza contacto que no es teléfono ni correo', () => {
    expect(legible({ ...base, contacto: 'solo-texto' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
  })

  it('rechaza contacto con formato de correo inválido', () => {
    expect(legible({ ...base, contacto: 'no-es-un-correo@' })).toBe(
      'El contacto debe ser un teléfono 8877-9955 o un correo válido'
    )
  })

  it('rechaza registro con tipo inválido', () => {
    expect(legible({ ...base, tipoRegistro: 'otro' })).toBe('El tipo de registro es inválido')
  })

  it('rechaza correo con formato inválido', () => {
    expect(legible({ ...base, correo: 'no-es-un-correo' })).toBe('El correo es inválido')
  })

  it('rechaza registro online sin comprobante', () => {
    expect(legible({ ...base })).toBe('El comprobante de pago es obligatorio')
  })

  it('rechaza registro por encargado incompleto', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      esRegistroPorEncargado: true,
      encargadoNombre: 'Padre Gómez',
      comprobante: { contentType: 'image/jpeg', s3Key: 'comprobantes/b.jpg' }
    })
    expect(resultado.success).toBe(false)
    expect(primerErrorLegible(resultado.error as z.ZodError)).toBe(
      'Los datos del encargado son obligatorios'
    )
  })

  it('rechaza nombre de encargado sin apellido', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      esRegistroPorEncargado: true,
      encargadoNombre: 'Padre',
      encargadoContacto: '1122-3344',
      comprobante: { contentType: 'image/jpeg', s3Key: 'comprobantes/b.jpg' }
    })
    expect(resultado.success).toBe(false)
    expect(primerErrorLegible(resultado.error as z.ZodError)).toBe(
      'El nombre del encargado debe incluir nombre y apellido'
    )
  })

  it('rechaza nombre del encargado con números', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      esRegistroPorEncargado: true,
      encargadoNombre: 'Padre 1',
      encargadoContacto: '1122-3344',
      comprobante: { contentType: 'image/jpeg', s3Key: 'comprobantes/b.jpg' }
    })
    expect(resultado.success).toBe(false)
    expect(primerErrorLegible(resultado.error as z.ZodError)).toBe(
      'El nombre del encargado no puede contener números'
    )
  })

  it('rechaza contacto del encargado con formato inválido', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      esRegistroPorEncargado: true,
      encargadoNombre: 'Padre Gómez',
      encargadoContacto: 'texto',
      comprobante: { contentType: 'image/jpeg', s3Key: 'comprobantes/b.jpg' }
    })
    expect(resultado.success).toBe(false)
    expect(primerErrorLegible(resultado.error as z.ZodError)).toBe(
      'El contacto del encargado debe ser un teléfono 8877-9955 o un correo válido'
    )
  })

  it('acepta registro por encargado completo con teléfono de 8 dígitos', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      esRegistroPorEncargado: true,
      encargadoNombre: 'Padre Gómez',
      encargadoContacto: '1122-3344',
      comprobante: { contentType: 'image/jpeg', s3Key: 'comprobantes/b.jpg' }
    })
    expect(resultado.success).toBe(true)
  })

  it('acepta registro in situ sin comprobante', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      nombre: 'Leo García',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ',
      localidad: 'San Pedro Sula',
      region: '12',
      edad: 30,
      diasAsistencia: ['jueves-24'],
      rol: 'joven'
    })
    expect(resultado.success).toBe(true)
  })
})

describe('solicitarComprobanteUploadSchema', () => {
  it('acepta un tipo permitido', () => {
    expect(solicitarComprobanteUploadSchema.safeParse({ contentType: 'application/pdf' }).success).toBe(true)
  })

  it('rechaza un tipo no permitido', () => {
    const resultado = solicitarComprobanteUploadSchema.safeParse({ contentType: 'image/gif' })
    expect(resultado.success).toBe(false)
    expect(primerErrorLegible(resultado.error as z.ZodError)).toBe(
      'El tipo de archivo no está permitido'
    )
  })
})