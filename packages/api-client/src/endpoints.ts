import type { EstadoPago } from '@convencion/shared-types'

export const ENDPOINTS = {
  registrarParticipante: '/inscripciones',
  listarParticipantes: '/inscripciones',
  obtenerParticipante: (participantId: string) => `/inscripciones/${participantId}`,
  solicitarComprobanteUpload: '/inscripciones/comprobante-upload',
  revisarPago: '/pagos/revisar',
  listarBandejaPagos: (estado: EstadoPago) => `/pagos/${estado}`,
  asignarEquipo: '/equipos/asignar',
  obtenerConteos: '/equipos/conteos',
  configEquipos: '/equipos/config',
  obtenerEquipos: '/equipos',
  listarIntegrantesDeEquipo: (color: string) => `/equipos/${color}`,
  checkIn: '/checkin'
} as const