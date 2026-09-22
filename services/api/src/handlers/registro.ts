import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import type { RegistrarParticipanteInput } from '@convencion/shared-types'

const app = new Hono()

app.post('/', async (c) => {
  const input = await c.req.json<RegistrarParticipanteInput>()
  // TODO(registro): Módulo 1 (online) y Módulo 3 (in situ).
  // Guardar en DynamoDB, generar participantId/QR y devolver RegistrarParticipanteOutput.
  console.log('[registro] input recibido', input)
  return c.json({ message: 'Registro aún no implementado' }, 501)
})

export const handler = handle(app)
export default app