import type { SolicitarComprobanteUploadOutput } from '@convencion/shared-types'

export const TIPOS_COMPROBANTE_PERMITIDOS = ['image/png', 'image/jpeg', 'application/pdf'] as const

export function esTipoComprobantePermitido(contentType: string): boolean {
  return (TIPOS_COMPROBANTE_PERMITIDOS as readonly string[]).includes(contentType)
}

export async function subirComprobante(
  solicitud: SolicitarComprobanteUploadOutput,
  archivo: File
): Promise<void> {
  const respuesta = await fetch(solicitud.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': solicitud.contentType },
    body: archivo
  })
  if (!respuesta.ok) {
    throw new Error('Error al subir el comprobante')
  }
}