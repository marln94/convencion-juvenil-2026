export const PATRON_TELEFONO = /^\d{4}-\d{4}$/
export const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const OCHO_DIGITOS = /^\d{8}$/

/** Formatea dígitos sueltos como `dddd-dddd`. Ignora todo lo que no sea dígito y deja un máximo de 8. */
export function formatearTelefono(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  return digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos
}

/**
 * Normaliza un teléfono para persistir: acepta el formato `dddd-dddd` o sus 8
 * dígitos sin guion, y devuelve siempre `dddd-dddd`. Cualquier otra cosa es
 * inválida (`null`).
 */
export function normalizarTelefono(valor: string): string | null {
  if (PATRON_TELEFONO.test(valor)) return valor
  if (OCHO_DIGITOS.test(valor)) return formatearTelefono(valor)
  return null
}

export function esTelefono(valor: string): boolean {
  return PATRON_TELEFONO.test(valor)
}

export function esCorreo(valor: string): boolean {
  return PATRON_CORREO.test(valor)
}
