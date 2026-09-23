import { describe, expect, it } from 'vitest'

import {
  esContentTypePermitido,
  firmarSubidaComprobante,
  CONTENT_TYPES_PERMITIDOS
} from './comprobante.js'
import { HttpError } from './http-error.js'

describe('esContentTypePermitido', () => {
  it('acepta png, jpeg y pdf', () => {
    for (const tipo of CONTENT_TYPES_PERMITIDOS) {
      expect(esContentTypePermitido(tipo)).toBe(true)
    }
  })

  it('rechaza otros tipos', () => {
    expect(esContentTypePermitido('image/gif')).toBe(false)
    expect(esContentTypePermitido('text/plain')).toBe(false)
  })
})

describe('firmarSubidaComprobante', () => {
  it('devuelve una URL firmada con la s3Key pedida', async () => {
    process.env.COMPROBANTES_BUCKET = 'convencion-comprobantes-test'

    const res = await firmarSubidaComprobante('image/png')

    expect(res.uploadUrl).toContain('X-Amz-')
    expect(res.uploadUrl).toContain(res.s3Key)
    expect(res.s3Key).toMatch(/^comprobantes\/[0-9a-f-]{36}\.png$/)
    expect(res.contentType).toBe('image/png')
  })

  it('rechaza un tipo no permitido con HttpError 400', async () => {
    process.env.COMPROBANTES_BUCKET = 'convencion-comprobantes-test'

    await expect(firmarSubidaComprobante('image/gif')).rejects.toBeInstanceOf(HttpError)
    await expect(firmarSubidaComprobante('image/gif')).rejects.toMatchObject({ status: 400 })
  })
})