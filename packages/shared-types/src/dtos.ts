import type { Participante, TipoRegistro } from './participante.js'

export interface RegistrarParticipanteInput {
  nombre: string
  contacto: string
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

export interface RevisarPagoInput {
  participantId: string
  decision: 'aprobar' | 'rechazar'
  motivoRechazo?: string
}

export interface RevisarPagoOutput {
  participante: Participante
}

export interface GenerarEquiposOutput {
  asignacion: Record<string, string>
  bloqueado: boolean
}

export interface CheckInInput {
  participantId: string
}

export interface CheckInOutput {
  participante: Participante
  accesoPermitido: boolean
}