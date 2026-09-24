import { existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const { default: app } = await import('./handlers/registro.js')
const { default: listado } = await import('./handlers/listar-participantes.js')
const { default: revisarPago } = await import('./handlers/revisar-pago.js')
const { default: generarEquipos } = await import('./handlers/generar-equipos.js')
const { default: checkin } = await import('./handlers/checkin.js')

app.route('/', listado)
app.route('/', revisarPago)
app.route('/', generarEquipos)
app.route('/checkin', checkin)

const { serve } = await import('@hono/node-server')

const PUERTO = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port: PUERTO }, (info) => {
  console.log(`[api] local escuchando en http://localhost:${info.port}`)
})