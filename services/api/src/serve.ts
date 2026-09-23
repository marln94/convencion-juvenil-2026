import { existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const { default: app } = await import('./handlers/registro.js')

const { serve } = await import('@hono/node-server')

const PUERTO = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port: PUERTO }, (info) => {
  console.log(`[api] local escuchando en http://localhost:${info.port}`)
})