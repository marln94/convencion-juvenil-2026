import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'

import { corsHabilitado } from './lib/cors.js'
import app from './handlers/checkin.js'

const api = new Hono()
api.use('*', corsHabilitado())
api.route('/checkin', app)

export const handler = handle(api)
export default api