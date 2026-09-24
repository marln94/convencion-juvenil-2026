import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { ZodError } from 'zod'
import type {
  BandejaPagosItem,
  EstadoPago,
  ListarBandejaPagosOutput,
  RevisarPagoOutput
} from '@convencion/shared-types'

import { requireAuth } from '../lib/auth.js'
import { corsHabilitado } from '../lib/cors.js'
import { firmarLecturaComprobante } from '../lib/comprobante.js'
import { HttpError } from '../lib/http-error.js'
import { primerErrorLegible, revisarPagoSchema } from '../lib/validacion.js'
import { actualizarEstadoPago, listarPorEstadoPago } from '../repos/participantes.js'

const ESTADOS_PAGO: readonly EstadoPago[] = ['pendiente', 'pagado', 'rechazado']

const app = new Hono()

app.use('*', corsHabilitado())
app.use('*', requireAuth())

app.get('/pagos/:estado', async (c) => {
  const estado = c.req.param('estado') as EstadoPago
  if (!ESTADOS_PAGO.includes(estado)) {
    throw new HttpError(400, 'El estado de pago es inválido')
  }

  const participantes = await listarPorEstadoPago(estado)

  const items: BandejaPagosItem[] = []
  for (const participante of participantes) {
    items.push({
      participantId: participante.participantId,
      nombre: participante.nombre,
      correo: participante.correo,
      estadoPago: participante.estadoPago,
      tieneComprobante: Boolean(participante.comprobanteS3Key),
      vistaComprobanteUrl: participante.comprobanteS3Key
        ? await firmarLecturaComprobante(participante.comprobanteS3Key)
        : undefined,
      fechaRegistro: participante.fechaRegistro
    })
  }

  const respuesta: ListarBandejaPagosOutput = { items }
  return c.json(respuesta)
})

app.post('/pagos/revisar', async (c) => {
  const cuerpo = (await c.req.json()) as unknown
  const datos = revisarPagoSchema.parse(cuerpo)

  const estado: EstadoPago = datos.decision === 'aprobar' ? 'pagado' : 'rechazado'
  const participante = await actualizarEstadoPago(datos.participantId, {
    estado,
    motivoRechazo: datos.motivoRechazo
  })
  if (!participante) {
    throw new HttpError(404, 'El participante no existe')
  }

  const respuesta: RevisarPagoOutput = {
    participante,
    revisadoEn: participante.revisadoEn ?? new Date().toISOString(),
    motivoRechazo: participante.motivoRechazo
  }
  return c.json(respuesta)
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
  console.error('[revisar-pago] error no controlado', error)
  return c.json({ message: 'Error interno del servidor' }, 500)
})

export const handler = handle(app)
export default app