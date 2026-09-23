import { z } from 'zod'

import { CONTENT_TYPES_PERMITIDOS } from './comprobante.js'

const TIPOS_REGISTRO = ['online', 'in_situ'] as const

const comprobanteSchema = z.object({
  contentType: z.enum(CONTENT_TYPES_PERMITIDOS),
  s3Key: z.string().min(1)
})

export const registrarParticipanteSchema = z
  .object({
    nombre: z.string().min(1),
    contacto: z.string().min(1),
    correo: z.email().optional(),
    esRegistroPorEncargado: z.boolean().optional(),
    encargadoNombre: z.string().optional(),
    encargadoContacto: z.string().optional(),
    tipoRegistro: z.enum(TIPOS_REGISTRO),
    comprobante: comprobanteSchema.optional()
  })
  .superRefine((datos, ctx) => {
    if (datos.esRegistroPorEncargado && (!datos.encargadoNombre || !datos.encargadoContacto)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['encargadoNombre'],
        message: 'Los datos del encargado son obligatorios'
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
  contentType: z.enum(CONTENT_TYPES_PERMITIDOS),
  nombreArchivo: z.string().optional()
})

export type RegistrarParticipanteValido = z.infer<typeof registrarParticipanteSchema>
export type SolicitarComprobanteUploadValido = z.infer<typeof solicitarComprobanteUploadSchema>

const MENSAJES_POR_PATH: Record<string, string> = {
  nombre: 'El nombre es obligatorio',
  contacto: 'El contacto es obligatorio',
  correo: 'El correo es inválido',
  tipoRegistro: 'El tipo de registro es inválido',
  comprobante: 'El comprobante de pago es obligatorio',
  encargadoNombre: 'Los datos del encargado son obligatorios',
  encargadoContacto: 'Los datos del encargado son obligatorios',
  contentType: 'El tipo de archivo no está permitido'
}

export function primerErrorLegible(error: z.ZodError): string {
  const primer = error.issues[0]
  if (!primer) {
    return 'Solicitud inválida'
  }
  const clave = primer.path[0]
  if (typeof clave === 'string' && MENSAJES_POR_PATH[clave]) {
    return MENSAJES_POR_PATH[clave]
  }
  return primer.message ?? 'Solicitud inválida'
}