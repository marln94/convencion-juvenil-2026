import type { Participante, EstadoPago, TipoRegistro } from './participante.js'

export interface RegistrarParticipanteInput {
  participantId?: string
  nombre: string
  contacto: string
  correo?: string
  esRegistroPorEncargado?: boolean
  encargadoNombre?: string
  encargadoContacto?: string
  tipoRegistro: TipoRegistro
  comprobante?: {
    contentType: string
    s3Key: string
  }
}

export interface RegistrarParticipanteOutput {
  participante: Participante
  codigoQr: string
}

export interface ResumenParticipante {
  participantId: string
  nombre: string
  estadoPago: EstadoPago
  tipoRegistro?: TipoRegistro
  equipoColor?: string
  checkIn: boolean
}

export interface ListarParticipantesInput {
  estadoPago?: EstadoPago
  tipoRegistro?: TipoRegistro
  checkIn?: boolean
  limit?: number
  nextToken?: string
}

export interface ListarParticipantesOutput {
  items: ResumenParticipante[]
  pagination: {
    nextToken?: string
    total: number
  }
}

export interface ObtenerParticipanteOutput {
  participante: Participante
}

export interface SolicitarComprobanteUploadInput {
  contentType: string
  nombreArchivo?: string
}

export interface SolicitarComprobanteUploadOutput {
  uploadUrl: string
  s3Key: string
  contentType: string
  expiraEnSegundos: number
}

export interface RevisarPagoInput {
  participantId: string
  decision: 'aprobar' | 'rechazar'
  motivoRechazo?: string
}

export interface BandejaPagosItem {
  participantId: string
  nombre: string
  correo?: string
  estadoPago: EstadoPago
  tieneComprobante: boolean
  vistaComprobanteUrl?: string
  fechaRegistro: string
}

export interface ListarBandejaPagosOutput {
  items: BandejaPagosItem[]
}

export interface RevisarPagoOutput {
  participante: Participante
  revisadoEn: string
  motivoRechazo?: string
}

export interface EquiposAsignacionOutput {
  asignacion: Record<string, string>
  porColor: Record<string, string[]>
  bloqueado: boolean
}

export interface GenerarEquiposOutput extends EquiposAsignacionOutput {}

export interface ConfiguracionEquiposInput {
  colores: string[]
}

export interface BloquearEquiposOutput {
  bloqueado: boolean
  fechaGeneracion?: string
}

export interface ListarIntegrantesEquipoOutput {
  color: string
  items: ResumenParticipante[]
}

export interface CheckInInput {
  participantId: string
}

export interface CheckInOutput {
  participante: Participante
}