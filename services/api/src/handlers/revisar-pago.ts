import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import type { RevisarPagoInput } from '@convencion/shared-types'

const app = new Hono()

app.post('/', async (c) => {
  const input = await c.req.json<RevisarPagoInput>()
  // TODO(revisar-pago): Módulo 2.
  // Aprobar/rechazar el comprobante, actualizar estadoPago y notificar por SES.
  console.log('[revisar-pago] input recibido', input)
  return c.json({ message: 'Revisión de pago aún no implementada' }, 501)
})

export const handler = handle(app)
export default app