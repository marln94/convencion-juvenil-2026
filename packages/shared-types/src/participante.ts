export type EstadoPago = 'pendiente' | 'pagado' | 'rechazado'

export type TipoRegistro = 'online' | 'in_situ'

export interface Participante {
  participantId: string
  nombre: string
  contacto?: string
  correo?: string
  localidad: string
  region: string
  edad: number
  diasAsistencia: string[]
  rol: 'joven' | 'encargado' | 'nexo'
  esRegistroPorEncargado: boolean
  encargadoNombre?: string
  encargadoContacto?: string
  tipoRegistro: TipoRegistro
  estadoPago: EstadoPago
  comprobanteS3Key?: string
  revisadoEn?: string
  motivoRechazo?: string
  equipoColor?: string
  checkIn: boolean
  checkInTimestamp?: string
  fechaRegistro: string
}