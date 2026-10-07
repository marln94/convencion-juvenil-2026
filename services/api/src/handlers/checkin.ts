import { nombresEquipos, type CheckInOutput, type Participante } from '@convencion/shared-types'
import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { ZodError } from 'zod'

import { requireAuth } from '../lib/auth.js'
import { corsHabilitado } from '../lib/cors.js'
import { HttpError } from '../lib/http-error.js'
import { checkInSchema, primerErrorLegible } from '../lib/validacion.js'
import { obtenerConfiguracionEquipos } from '../repos/configuracion.js'
import { marcarCheckIn, obtenerParticipante } from '../repos/participantes.js'

const app = new Hono()

app.use('*', corsHabilitado())
app.use('*', requireAuth())

app.post('/', async (c) => {
  const input = await c.req.json()
  const datos = checkInSchema.parse(input)

  const existente = await obtenerParticipante(datos.participantId)
  if (!existente) {
    throw new HttpError(404, 'El código no corresponde a un participante')
  }

  if (datos.equipoColor) {
    const configuracion = await obtenerConfiguracionEquipos()
    const activos =
      configuracion && configuracion.colores.length > 0
        ? configuracion.colores
        : nombresEquipos
    if (!activos.includes(datos.equipoColor)) {
      throw new HttpError(400, 'El equipo seleccionado no existe')
    }
  }

  const timestamp = await marcarCheckIn(datos.participantId, datos.equipoColor)
  const participante: Participante = {
    ...existente,
    equipoColor: datos.equipoColor ?? existente.equipoColor,
    checkIn: true,
    checkInTimestamp: existente.checkInTimestamp ?? timestamp
  }

  const respuesta: CheckInOutput = { participante }
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
  console.error('[checkin] error no controlado', error)
  return c.json({ message: 'Error interno del servidor' }, 500)
})

export const handler = handle(app)
export default app