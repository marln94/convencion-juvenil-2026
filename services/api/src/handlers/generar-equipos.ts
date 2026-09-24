import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { ZodError } from 'zod'
import type {
  BloquearEquiposOutput,
  ConfiguracionEquipos,
  EquiposAsignacionOutput,
  GenerarEquiposOutput,
  ListarIntegrantesEquipoOutput
} from '@convencion/shared-types'

import { requireAuth } from '../lib/auth.js'
import { corsHabilitado } from '../lib/cors.js'
import { HttpError } from '../lib/http-error.js'
import { COLORES_EQUIPO_POR_DEFECTO, sortearEquipos } from '../lib/sorteo.js'
import { coloresEquiposSchema, primerErrorLegible } from '../lib/validacion.js'
import {
  actualizarColores,
  bloquearEquipos,
  obtenerConfiguracionEquipos,
  reclamarGeneracion
} from '../repos/configuracion.js'
import { asignarEquipoColor, listarIntegrantesDeEquipo, listarPorEstadoPago } from '../repos/participantes.js'

const app = new Hono()

app.use('*', corsHabilitado())
app.use('*', requireAuth())

function coloresActivos(configuracion: ConfiguracionEquipos | undefined): readonly string[] {
  return configuracion && configuracion.colores.length > 0
    ? configuracion.colores
    : COLORES_EQUIPO_POR_DEFECTO
}

app.post('/equipos/generar', async (c) => {
  await reclamarGeneracion()

  const configuracion = await obtenerConfiguracionEquipos()
  const colores = coloresActivos(configuracion)
  const pagados = await listarPorEstadoPago('pagado')

  const asignacion = sortearEquipos(
    pagados.map((participante) => participante.participantId),
    colores
  )

  await asignarEquipoColor(
    pagados.map((participante) => ({
      participante,
      equipoColor: asignacion[participante.participantId] ?? colores[0] ?? 'sin-equipo'
    }))
  )

  const respuesta: GenerarEquiposOutput = {
    asignacion,
    porColor: agruparPorColor(asignacion, colores),
    bloqueado: configuracion?.bloqueado ?? false
  }
  return c.json(respuesta)
})

app.post('/equipos/bloquear', async (c) => {
  const bloqueo = await bloquearEquipos()
  const respuesta: BloquearEquiposOutput = bloqueo
  return c.json(respuesta)
})

app.post('/equipos/config', async (c) => {
  const cuerpo = (await c.req.json()) as unknown
  const datos = coloresEquiposSchema.parse(cuerpo)

  const configuracion = await actualizarColores(datos.colores)
  return c.json(configuracion)
})

app.get('/equipos/:color', async (c) => {
  const color = c.req.param('color')
  const items = await listarIntegrantesDeEquipo(color)
  const respuesta: ListarIntegrantesEquipoOutput = { color, items }
  return c.json(respuesta)
})

app.get('/equipos', async (c) => {
  const configuracion = await obtenerConfiguracionEquipos()
  const colores = coloresActivos(configuracion)

  const asignacion: Record<string, string> = {}
  const porColor: Record<string, string[]> = {}
  for (const color of colores) {
    const integrantes = await listarIntegrantesDeEquipo(color)
    porColor[color] = integrantes.map((integrante) => integrante.participantId)
    for (const integrante of integrantes) {
      asignacion[integrante.participantId] = color
    }
  }

  const respuesta: EquiposAsignacionOutput = {
    asignacion,
    porColor,
    bloqueado: configuracion?.bloqueado ?? false
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
  console.error('[generar-equipos] error no controlado', error)
  return c.json({ message: 'Error interno del servidor' }, 500)
})

function agruparPorColor(
  asignacion: Record<string, string>,
  colores: readonly string[]
): Record<string, string[]> {
  const porColor: Record<string, string[]> = {}
  for (const color of colores) porColor[color] = []
  for (const [participantId, color] of Object.entries(asignacion)) {
    const grupo = porColor[color] ?? []
    grupo.push(participantId)
    porColor[color] = grupo
  }
  return porColor
}

export const handler = handle(app)
export default app