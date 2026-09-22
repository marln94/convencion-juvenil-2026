import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import type { CheckInInput } from '@convencion/shared-types'

const app = new Hono()

app.post('/', async (c) => {
  const input = await c.req.json<CheckInInput>()
  // TODO(checkin): Módulo 6.
  // GetItem por participantId, validar pago y marcar checkIn con timestamp.
  console.log('[checkin] input recibido', input)
  return c.json({ message: 'Check-in aún no implementado' }, 501)
})

export const handler = handle(app)
export default app