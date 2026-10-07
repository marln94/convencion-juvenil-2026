import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { ZodError } from 'zod'
import {
  nombresEquipos,
  type AsignarEquipoOutput,
  type ConfiguracionEquipos,
  type ConteosEquiposOutput,
  type EquiposAsignacionOutput,
  type ListarIntegrantesEquipoOutput
} from '@convencion/shared-types'

import { requireAuth } from '../lib/auth.js'
import { corsHabilitado } from '../lib/cors.js'
import { HttpError } from '../lib/http-error.js'
import { asignarEquipoSchema, coloresEquiposSchema, primerErrorLegible } from '../lib/validacion.js'
import { actualizarColores, obtenerConfiguracionEquipos } from '../repos/configuracion.js'
import {
  asignarEquipoColorManual,
  contarPorEquipo,
  listarIntegrantesDeEquipo,
  obtenerParticipante
} from '../repos/participantes.js'

const app = new Hono()

app.use('*', corsHabilitado())
app.use('*', requireAuth())

function equiposActivos(configuracion: ConfiguracionEquipos | undefined): readonly string[] {
  return configuracion && configuracion.colores.length > 0
    ? configuracion.colores
    : nombresEquipos
}

function validarEquipoActivo(equipoColor: string, activos: readonly string[]): void {
  if (!activos.includes(equipoColor)) {
    throw new HttpError(400, 'El equipo seleccionado no existe')
  }
}

app.post('/equipos/asignar', async (c) => {
  const cuerpo = (await c.req.json()) as unknown
  const datos = asignarEquipoSchema.parse(cuerpo)

  const participante = await obtenerParticipante(datos.participantId)
  if (!participante) {
    throw new HttpError(404, 'El código no corresponde a un participante')
  }

  const configuracion = await obtenerConfiguracionEquipos()
  validarEquipoActivo(datos.equipoColor, equiposActivos(configuracion))

  const actualizado = await asignarEquipoColorManual(datos.participantId, datos.equipoColor)
  const respuesta: AsignarEquipoOutput = { participante: actualizado ?? participante }
  return c.json(respuesta)
})

app.post('/equipos/config', async (c) => {
  const cuerpo = (await c.req.json()) as unknown
  const datos = coloresEquiposSchema.parse(cuerpo)

  const configuracion = await actualizarColores(datos.colores)
  return c.json(configuracion)
})

app.get('/equipos/conteos', async (c) => {
  const configuracion = await obtenerConfiguracionEquipos()
  const activos = equiposActivos(configuracion)
  const conteos = await contarPorEquipo(activos)
  const respuesta: ConteosEquiposOutput = conteos
  return c.json(respuesta)
})

app.get('/equipos/:color', async (c) => {
  const color = c.req.param('color')
  const items = await listarIntegrantesDeEquipo(color)
  const respuesta: ListarIntegrantesEquipoOutput = { color, items }
  return c.json(respuesta)
})

app.get('/equipos', async (c) => {
  const configuracion = await obtenerConfiguracionEquipos()
  const activos = equiposActivos(configuracion)

  const [asignacion, porColor, conteos] = await Promise.all([
    cargarAsignacion(activos),
    cargarPorColor(activos),
    contarPorEquipo(activos)
  ])

  const respuesta: EquiposAsignacionOutput = { asignacion, porColor, conteos }
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
  console.error('[equipos] error no controlado', error)
  return c.json({ message: 'Error interno del servidor' }, 500)
})

async function cargarAsignacion(activos: readonly string[]): Promise<Record<string, string>> {
  const asignacion: Record<string, string> = {}
  for (const color of activos) {
    for (const integrante of await listarIntegrantesDeEquipo(color)) {
      asignacion[integrante.participantId] = color
    }
  }
  return asignacion
}

async function cargarPorColor(activos: readonly string[]): Promise<Record<string, string[]>> {
  const porColor: Record<string, string[]> = {}
  for (const color of activos) {
    const integrantes = await listarIntegrantesDeEquipo(color)
    porColor[color] = integrantes.map((integrante) => integrante.participantId)
  }
  return porColor
}

export const handler = handle(app)
export default app