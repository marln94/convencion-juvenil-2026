export type EstadoPago = 'pendiente' | 'pagado' | 'rechazado'

export type TipoRegistro = 'online' | 'in_situ'

export interface Participante {
  participantId: string
  nombre: string
  contacto: string
  correo?: string
  esRegistroPorEncargado: boolean
  encargadoNombre?: string
  encargadoContacto?: string
  tipoRegistro: TipoRegistro
  estadoPago: EstadoPago
  comprobanteS3Key?: string
  equipoColor?: string
  checkIn: boolean
  checkInTimestamp?: string
  fechaRegistro: string
}