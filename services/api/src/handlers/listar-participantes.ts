import type { EstadoPago, ListarParticipantesOutput, ObtenerParticipanteOutput, TipoRegistro } from '@convencion/shared-types'
import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'

import { requireAuth } from '../lib/auth.js'
import { corsHabilitado } from '../lib/cors.js'
import { HttpError } from '../lib/http-error.js'
import { listarParticipantes, obtenerParticipante } from '../repos/participantes.js'

const ESTADOS_PAGO: readonly EstadoPago[] = ['pendiente', 'pagado', 'rechazado']
const TIPOS_REGISTRO: readonly TipoRegistro[] = ['online', 'in_situ']

function leerBooleano(valor: string | undefined): boolean | undefined {
  if (valor === undefined) return undefined
  if (valor === 'true') return true
  if (valor === 'false') return false
  return undefined
}

const app = new Hono()

app.use('*', corsHabilitado())
app.use('*', requireAuth())

app.get('/inscripciones', async (c) => {
  const url = new URL(c.req.url)
  const estadoPago = url.searchParams.get('estadoPago') ?? undefined
  const tipoRegistro = url.searchParams.get('tipoRegistro') ?? undefined
  const checkInTexto = url.searchParams.get('checkIn') ?? undefined
  const limiteTexto = url.searchParams.get('limit') ?? undefined
  const nextToken = url.searchParams.get('nextToken') ?? undefined

  if (estadoPago !== undefined && !ESTADOS_PAGO.includes(estadoPago as EstadoPago)) {
    return c.json({ message: 'El estado de pago es inválido' }, 400)
  }
  if (tipoRegistro !== undefined && !TIPOS_REGISTRO.includes(tipoRegistro as TipoRegistro)) {
    return c.json({ message: 'El tipo de registro es inválido' }, 400)
  }
  const checkIn = leerBooleano(checkInTexto)
  if (checkInTexto !== undefined && checkIn === undefined) {
    return c.json({ message: 'checkIn debe ser true o false' }, 400)
  }
  let limit: number | undefined
  if (limiteTexto !== undefined) {
    limit = Number(limiteTexto)
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      return c.json({ message: 'limit debe ser un entero entre 1 y 500' }, 400)
    }
  }

  const resultado = await listarParticipantes({
    estadoPago: estadoPago as EstadoPago | undefined,
    tipoRegistro: tipoRegistro as TipoRegistro | undefined,
    checkIn,
    limit,
    nextToken
  })

  const respuesta: ListarParticipantesOutput = {
    items: resultado.items,
    pagination: resultado.pagination
  }
  return c.json(respuesta)
})

app.get('/inscripciones/:id', async (c) => {
  const id = c.req.param('id')
  const existente = await obtenerParticipante(id)
  if (!existente) {
    throw new HttpError(404, 'El participante no existe')
  }

  const respuesta: ObtenerParticipanteOutput = { participante: existente }
  return c.json(respuesta)
})

app.onError((error, c) => {
  if (error instanceof HttpError) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: error.status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  console.error('[listar-participantes] error no controlado', error)
  return c.json({ message: 'Error interno del servidor' }, 500)
})

export const handler = handle(app)
export default app