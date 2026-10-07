import type {
  AsignarEquipoInput,
  AsignarEquipoOutput,
  CheckInInput,
  CheckInOutput,
  ConfiguracionEquipos,
  ConfiguracionEquiposInput,
  ConteosEquiposOutput,
  EquiposAsignacionOutput,
  EstadoPago,
  ListarBandejaPagosOutput,
  ListarIntegrantesEquipoOutput,
  ListarParticipantesInput,
  ListarParticipantesOutput,
  ObtenerParticipanteOutput,
  RegistrarParticipanteInput,
  RegistrarParticipanteOutput,
  RevisarPagoInput,
  RevisarPagoOutput,
  SolicitarComprobanteUploadInput,
  SolicitarComprobanteUploadOutput
} from '@convencion/shared-types'

import { request, type OpcionesCliente } from './client.js'
import { ENDPOINTS } from './endpoints.js'

export interface ApiClient {
  registrarParticipante(input: RegistrarParticipanteInput): Promise<RegistrarParticipanteOutput>
  obtenerParticipante(participantId: string): Promise<ObtenerParticipanteOutput>
  listarParticipantes(input?: ListarParticipantesInput): Promise<ListarParticipantesOutput>
  solicitarComprobanteUpload(
    input: SolicitarComprobanteUploadInput
  ): Promise<SolicitarComprobanteUploadOutput>
  revisarPago(input: RevisarPagoInput): Promise<RevisarPagoOutput>
  listarBandejaPagos(estado: EstadoPago): Promise<ListarBandejaPagosOutput>
  asignarEquipo(input: AsignarEquipoInput): Promise<AsignarEquipoOutput>
  obtenerConteos(): Promise<ConteosEquiposOutput>
  configEquipos(input: ConfiguracionEquiposInput): Promise<ConfiguracionEquipos>
  obtenerEquipos(): Promise<EquiposAsignacionOutput>
  listarIntegrantesDeEquipo(color: string): Promise<ListarIntegrantesEquipoOutput>
  checkIn(input: CheckInInput): Promise<CheckInOutput>
}

function aConsulta(input: ListarParticipantesInput | undefined): string {
  if (!input) return ''
  const params = new URLSearchParams()
  if (input.estadoPago) params.set('estadoPago', input.estadoPago)
  if (input.tipoRegistro) params.set('tipoRegistro', input.tipoRegistro)
  if (input.checkIn !== undefined) params.set('checkIn', String(input.checkIn))
  if (input.limit !== undefined) params.set('limit', String(input.limit))
  if (input.nextToken) params.set('nextToken', input.nextToken)
  const q = params.toString()
  return q ? `?${q}` : ''
}

export function createApiClient(baseUrl: string, opciones: OpcionesCliente = {}): ApiClient {
  return {
    registrarParticipante: (input) =>
      request(
        baseUrl,
        ENDPOINTS.registrarParticipante,
        { method: 'POST', body: JSON.stringify(input) },
        opciones
      ),
    obtenerParticipante: (participantId) =>
      request(baseUrl, ENDPOINTS.obtenerParticipante(participantId), undefined, opciones),
    listarParticipantes: (input) =>
      request(baseUrl, `${ENDPOINTS.listarParticipantes}${aConsulta(input)}`, undefined, opciones),
    solicitarComprobanteUpload: (input) =>
      request(
        baseUrl,
        ENDPOINTS.solicitarComprobanteUpload,
        { method: 'POST', body: JSON.stringify(input) },
        opciones
      ),
    revisarPago: (input) =>
      request(
        baseUrl,
        ENDPOINTS.revisarPago,
        { method: 'POST', body: JSON.stringify(input) },
        opciones
      ),
    listarBandejaPagos: (estado) =>
      request(baseUrl, ENDPOINTS.listarBandejaPagos(estado), undefined, opciones),
    asignarEquipo: (input) =>
      request(
        baseUrl,
        ENDPOINTS.asignarEquipo,
        { method: 'POST', body: JSON.stringify(input) },
        opciones
      ),
    obtenerConteos: () => request(baseUrl, ENDPOINTS.obtenerConteos, undefined, opciones),
    configEquipos: (input) =>
      request(
        baseUrl,
        ENDPOINTS.configEquipos,
        { method: 'POST', body: JSON.stringify(input) },
        opciones
      ),
    obtenerEquipos: () => request(baseUrl, ENDPOINTS.obtenerEquipos, undefined, opciones),
    listarIntegrantesDeEquipo: (color) =>
      request(baseUrl, ENDPOINTS.listarIntegrantesDeEquipo(color), undefined, opciones),
    checkIn: (input) =>
      request(baseUrl, ENDPOINTS.checkIn, { method: 'POST', body: JSON.stringify(input) }, opciones)
  }
}

export { ApiError, type OpcionesCliente } from './client.js'
export { ENDPOINTS } from './endpoints.js'