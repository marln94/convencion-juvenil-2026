import { z } from 'zod'

import { CONTENT_TYPES_PERMITIDOS } from './comprobante.js'

const TIPOS_REGISTRO = ['online', 'in_situ'] as const

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PATRON_TELEFONO = /^\d{4}-\d{4}$/

function validarContacto(valor: string): boolean {
  if (valor.includes('@')) {
    return PATRON_EMAIL.test(valor)
  }
  return PATRON_TELEFONO.test(valor)
}

function contieneNumeros(valor: string): boolean {
  return /\d/.test(valor)
}

const comprobanteSchema = z.object({
  contentType: z.enum(CONTENT_TYPES_PERMITIDOS, {
    message: 'El tipo de archivo no está permitido'
  }),
  s3Key: z.string().min(1, { message: 'El comprobante de pago es inválido' })
})

const nombreSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre es obligatorio' })
  .refine((valor) => !contieneNumeros(valor), { message: 'El nombre no puede contener números' })
  .refine((valor) => valor.split(/\s+/).length >= 2, {
    message: 'El nombre debe incluir nombre y apellido'
  })

const contactoSchema = z
  .string()
  .trim()
  .min(1, { message: 'El contacto es obligatorio' })
  .refine(validarContacto, {
    message: 'El contacto debe ser un teléfono 8877-9955 o un correo válido'
  })

export const registrarParticipanteSchema = z
  .object({
    participantId: z.string().uuid({ message: 'El participantId es inválido' }).optional(),
    nombre: nombreSchema,
    contacto: contactoSchema,
    correo: z.email({ message: 'El correo es inválido' }).optional(),
    esRegistroPorEncargado: z.boolean().optional(),
    encargadoNombre: z.string().optional(),
    encargadoContacto: z.string().optional(),
    tipoRegistro: z.enum(TIPOS_REGISTRO, { message: 'El tipo de registro es inválido' }),
    comprobante: comprobanteSchema.optional()
  })
  .superRefine((datos, ctx) => {
    if (
      datos.esRegistroPorEncargado &&
      (!datos.encargadoNombre?.trim() || !datos.encargadoContacto?.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['encargadoNombre'],
        message: 'Los datos del encargado son obligatorios'
      })
    }
    if (datos.encargadoNombre?.trim() && contieneNumeros(datos.encargadoNombre)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['encargadoNombre'],
        message: 'El nombre del encargado no puede contener números'
      })
    }
    if (datos.encargadoNombre?.trim() && datos.encargadoNombre.trim().split(/\s+/).length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['encargadoNombre'],
        message: 'El nombre del encargado debe incluir nombre y apellido'
      })
    }
    if (datos.encargadoContacto?.trim() && !validarContacto(datos.encargadoContacto.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['encargadoContacto'],
        message: 'El contacto del encargado debe ser un teléfono 8877-9955 o un correo válido'
      })
    }
    if (datos.tipoRegistro === 'online' && !datos.comprobante) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['comprobante'],
        message: 'El comprobante de pago es obligatorio'
      })
    }
  })

export const solicitarComprobanteUploadSchema = z.object({
  contentType: z.enum(CONTENT_TYPES_PERMITIDOS, {
    message: 'El tipo de archivo no está permitido'
  }),
  nombreArchivo: z.string().optional()
})

export type RegistrarParticipanteValido = z.infer<typeof registrarParticipanteSchema>
export type SolicitarComprobanteUploadValido = z.infer<typeof solicitarComprobanteUploadSchema>

export const revisarPagoSchema = z.object({
  participantId: z.string().trim().min(1, { message: 'El participantId es obligatorio' }),
  decision: z.enum(['aprobar', 'rechazar'], { message: 'La decisión es inválida' }),
  motivoRechazo: z
    .string()
    .trim()
    .min(1, { message: 'El motivo de rechazo no puede estar vacío' })
    .optional()
})

export type RevisarPagoValido = z.infer<typeof revisarPagoSchema>

export const coloresEquiposSchema = z.object({
  colores: z
    .array(z.string().trim().min(1, { message: 'Los colores no pueden estar vacíos' }))
    .min(1, { message: 'Se requiere al menos un color' })
})

export type ColoresEquiposValido = z.infer<typeof coloresEquiposSchema>

export const checkInSchema = z.object({
  participantId: z.string().trim().min(1, { message: 'El participantId es obligatorio' })
})

export type CheckInValido = z.infer<typeof checkInSchema>

export function primerErrorLegible(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Solicitud inválida'
}