import { describe, expect, it } from 'vitest'
import { formatearTelefono, normalizarTelefono, esTelefono } from '@convencion/shared-types'

describe('contacto helpers', () => {
  it('formatea 8 dígitos', () => {
    expect(formatearTelefono('88779955')).toBe('8877-9955')
  })

  it('formatea con guion parcial', () => {
    expect(formatearTelefono('8877')).toBe('8877')
    expect(formatearTelefono('88779')).toBe('8877-9')
  })

  it('normaliza 8 dígitos sin guion', () => {
    expect(normalizarTelefono('88779955')).toBe('8877-9955')
  })

  it('normaliza con guion', () => {
    expect(normalizarTelefono('8877-9955')).toBe('8877-9955')
  })

  it('rechaza 7 u 9 dígitos', () => {
    expect(normalizarTelefono('887799')).toBeNull()
    expect(normalizarTelefono('887799555')).toBeNull()
  })

  it('esTelefono solo acepta formato con guion', () => {
    expect(esTelefono('8877-9955')).toBe(true)
    expect(esTelefono('88779955')).toBe(false)
  })
})
