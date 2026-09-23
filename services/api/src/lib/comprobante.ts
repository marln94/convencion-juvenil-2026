import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { HttpError } from './http-error.js'

export const CONTENT_TYPES_PERMITIDOS = ['image/png', 'image/jpeg', 'application/pdf'] as const

export type ContentTypeComprobante = (typeof CONTENT_TYPES_PERMITIDOS)[number]

const EXTENSIONES: Record<ContentTypeComprobante, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/pdf': 'pdf'
}

export const VALIDEZ_SUBIDA_SEGUNDOS = 5 * 60
export const MAX_TAMANO_SUBIDA_BYTES = 5 * 1024 * 1024

let s3Client: S3Client | undefined

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' })
  }
  return s3Client
}

export function esContentTypePermitido(contentType: string): contentType is ContentTypeComprobante {
  return (CONTENT_TYPES_PERMITIDOS as readonly string[]).includes(contentType)
}

export async function firmarSubidaComprobante(contentType: string): Promise<{
  uploadUrl: string
  s3Key: string
  contentType: ContentTypeComprobante
}> {
  if (!esContentTypePermitido(contentType)) {
    throw new HttpError(400, 'El tipo de archivo no está permitido')
  }

  const bucket = process.env.COMPROBANTES_BUCKET
  if (!bucket) {
    throw new Error('Falta la variable de entorno COMPROBANTES_BUCKET')
  }

  const s3Key = `comprobantes/${randomUUID()}.${EXTENSIONES[contentType]}`
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    ContentType: contentType
  })
  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: VALIDEZ_SUBIDA_SEGUNDOS
  })

  return { uploadUrl, s3Key, contentType }
}