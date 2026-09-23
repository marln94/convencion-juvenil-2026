export const ENDPOINTS = {
  registrarParticipante: '/inscripciones',
  listarParticipantes: '/inscripciones',
  obtenerParticipante: (participantId: string) => `/inscripciones/${participantId}`,
  solicitarComprobanteUpload: '/inscripciones/comprobante-upload',
  revisarPago: '/pagos/revisar',
  generarEquipos: '/equipos/generar',
  checkIn: '/checkin'
} as const