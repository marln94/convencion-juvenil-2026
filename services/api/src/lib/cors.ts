import { cors } from 'hono/cors'

export function corsHabilitado() {
  return cors({
    origin: (origen) => origen ?? '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })
}