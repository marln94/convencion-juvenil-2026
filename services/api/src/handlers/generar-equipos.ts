import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'

const app = new Hono()

app.post('/', async (c) => {
  // TODO(generar-equipos): Módulo 4.
  // Consultar participantes pagados, sorteo balanceado entre los 13 colores,
  // BatchWrite del equipoColor y bloqueo si Configuracion.bloqueado = true.
  return c.json({ message: 'Generación de equipos aún no implementada' }, 501)
})

export const handler = handle(app)
export default app