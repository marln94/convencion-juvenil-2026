import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { primerErrorLegible, registrarParticipanteSchema, solicitarComprobanteUploadSchema } from './validacion.js'

const base = {
  nombre: 'Ana',
  contacto: '+54 111 222 3333',
  tipoRegistro: 'online'
}

function legible(payload: unknown): string {
  const resultado = registrarParticipanteSchema.safeParse(payload)
  if (resultado.success) {
    throw new Error('La validación debió fallar')
  }
  return primerErrorLegible(resultado.error)
}

describe('registrarParticipanteSchema', () => {
  it('acepta un registro online con comprobante y correo opcional', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      ...base,
      correo: 'ana@example.com',
      comprobante: { contentType: 'image/png', s3Key: 'comprobantes/a.png' }
    })
    expect(resultado.success).toBe(true)
  })

  it('rechaza registro sin nombre', () => {
    expect(legible({ ...base, nombre: '' })).toBe('El nombre es obligatorio')
  })

  it('rechaza registro sin contacto', () => {
    expect(legible({ ...base, contacto: '' })).toBe('El contacto es obligatorio')
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
      encargadoNombre: 'Padre',
      comprobante: { contentType: 'image/jpeg', s3Key: 'comprobantes/b.jpg' }
    })
    expect(resultado.success).toBe(false)
    expect(primerErrorLegible(resultado.error as z.ZodError)).toBe(
      'Los datos del encargado son obligatorios'
    )
  })

  it('acepta registro in situ sin comprobante', () => {
    const resultado = registrarParticipanteSchema.safeParse({
      nombre: 'Leo',
      contacto: 'leo@example.com',
      tipoRegistro: 'in_situ'
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