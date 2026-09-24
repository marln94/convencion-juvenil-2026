import { randomUUID } from 'node:crypto'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { S3ClientConfig } from '@aws-sdk/client-s3'
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
export const VALIDEZ_LECTURA_SEGUNDOS = 5 * 60
export const MAX_TAMANO_SUBIDA_BYTES = 5 * 1024 * 1024

export const ES_S3_LOCAL = Boolean(process.env.S3_ENDPOINT)

let s3Client: S3Client | undefined

function getS3Client(): S3Client {
  if (!s3Client) {
    const config: S3ClientConfig = {
      region: process.env.AWS_REGION ?? 'us-east-1',
      requestChecksumCalculation: 'WHEN_REQUIRED'
    }
    if (ES_S3_LOCAL && process.env.S3_ENDPOINT) {
      config.endpoint = process.env.S3_ENDPOINT
      config.forcePathStyle = true
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'minioadmin',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'minioadmin'
      }
    }
    s3Client = new S3Client(config)
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

export async function firmarLecturaComprobante(s3Key: string): Promise<string> {
  const bucket = process.env.COMPROBANTES_BUCKET
  if (!bucket) {
    throw new Error('Falta la variable de entorno COMPROBANTES_BUCKET')
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key
  })
  return getSignedUrl(getS3Client(), command, {
    expiresIn: VALIDEZ_LECTURA_SEGUNDOS
  })
}