import { randomUUID } from 'node:crypto'

import type { Participante, RegistrarParticipanteOutput, SolicitarComprobanteUploadOutput } from '@convencion/shared-types'
import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { ZodError } from 'zod'

import { firmarSubidaComprobante, VALIDEZ_SUBIDA_SEGUNDOS } from '../lib/comprobante.js'
import { HttpError } from '../lib/http-error.js'
import {
  primerErrorLegible,
  registrarParticipanteSchema,
  solicitarComprobanteUploadSchema
} from '../lib/validacion.js'
import { crearParticipante } from '../repos/participantes.js'

const app = new Hono()

app.post('/inscripciones/comprobante-upload', async (c) => {
  const input = await c.req.json()
  const datos = solicitarComprobanteUploadSchema.parse(input)
  const { uploadUrl, s3Key, contentType } = await firmarSubidaComprobante(datos.contentType)

  const respuesta: SolicitarComprobanteUploadOutput = {
    uploadUrl,
    s3Key,
    contentType,
    expiraEnSegundos: VALIDEZ_SUBIDA_SEGUNDOS
  }
  return c.json(respuesta, 200)
})

app.post('/inscripciones', async (c) => {
  const input = await c.req.json()
  const datos = registrarParticipanteSchema.parse(input)

  const participantId = randomUUID()
  const esInSitu = datos.tipoRegistro === 'in_situ'

  const participante: Participante = {
    participantId,
    nombre: datos.nombre,
    contacto: datos.contacto,
    correo: datos.correo,
    esRegistroPorEncargado: datos.esRegistroPorEncargado ?? false,
    encargadoNombre: datos.encargadoNombre,
    encargadoContacto: datos.encargadoContacto,
    tipoRegistro: datos.tipoRegistro,
    estadoPago: esInSitu ? 'pagado' : 'pendiente',
    comprobanteS3Key: datos.comprobante?.s3Key,
    checkIn: false,
    fechaRegistro: new Date().toISOString()
  }

  await crearParticipante(participante)

  const respuesta: RegistrarParticipanteOutput = { participante, codigoQr: participantId }
  return c.json(respuesta, 201)
})

app.onError((error, c) => {
  if (error instanceof ZodError) {
    return c.json({ message: primerErrorLegible(error) }, 400)
  }
  if (error instanceof HttpError) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: error.status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  console.error('[registro] error no controlado', error)
  return c.json({ message: 'Error interno del servidor' }, 500)
})

export const handler = handle(app)
export default app