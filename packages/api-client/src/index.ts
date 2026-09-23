import type {
  CheckInInput,
  CheckInOutput,
  GenerarEquiposOutput,
  Participante,
  RegistrarParticipanteInput,
  RegistrarParticipanteOutput,
  RevisarPagoInput,
  RevisarPagoOutput,
  SolicitarComprobanteUploadInput,
  SolicitarComprobanteUploadOutput
} from '@convencion/shared-types'

import { request } from './client.js'
import { ENDPOINTS } from './endpoints.js'

export interface ApiClient {
  registrarParticipante(input: RegistrarParticipanteInput): Promise<RegistrarParticipanteOutput>
  obtenerParticipante(participantId: string): Promise<Participante>
  listarParticipantes(): Promise<Participante[]>
  solicitarComprobanteUpload(
    input: SolicitarComprobanteUploadInput
  ): Promise<SolicitarComprobanteUploadOutput>
  revisarPago(input: RevisarPagoInput): Promise<RevisarPagoOutput>
  generarEquipos(): Promise<GenerarEquiposOutput>
  checkIn(input: CheckInInput): Promise<CheckInOutput>
}

export function createApiClient(baseUrl: string): ApiClient {
  return {
    registrarParticipante: (input) =>
      request(baseUrl, ENDPOINTS.registrarParticipante, {
        method: 'POST',
        body: JSON.stringify(input)
      }),
    obtenerParticipante: (participantId) =>
      request(baseUrl, ENDPOINTS.obtenerParticipante(participantId)),
    listarParticipantes: () => request(baseUrl, ENDPOINTS.listarParticipantes),
    solicitarComprobanteUpload: (input) =>
      request(baseUrl, ENDPOINTS.solicitarComprobanteUpload, {
        method: 'POST',
        body: JSON.stringify(input)
      }),
    revisarPago: (input) =>
      request(baseUrl, ENDPOINTS.revisarPago, { method: 'POST', body: JSON.stringify(input) }),
    generarEquipos: () => request(baseUrl, ENDPOINTS.generarEquipos, { method: 'POST' }),
    checkIn: (input) =>
      request(baseUrl, ENDPOINTS.checkIn, { method: 'POST', body: JSON.stringify(input) })
  }
}

export { ApiError } from './client.js'
export { ENDPOINTS } from './endpoints.js'