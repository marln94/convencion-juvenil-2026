export type Rol = 'joven' | 'encargado' | 'nexo'

export interface RangoEdad {
  min: number
  max: number
}

/**
 * Limite duro de edad. Aplica a todos los roles.
 *
 * Mismo numero que la banda de joven a proposito: el track del deslizador
 * recorre el dominio completo del schema, y la banda se dibuja encima.
 */
export const EDAD_MINIMA = 15
export const EDAD_MAXIMA = 99

/** Rango exclusivo de `joven`. Fuera de el, el registro se rechaza. */
export const BANDA_EDAD_JOVEN: RangoEdad = { min: EDAD_MINIMA, max: 30 }

export const RANGO_EDAD_ESTANDAR: RangoEdad = { min: EDAD_MINIMA, max: EDAD_MAXIMA }

/**
 * Rango que el formulario y la API aplican segun el rol. Fuente unica: el
 * cliente usa esto para bloquear el avance y el servidor para rechazar el
 * payload, y ambos deben coincidir.
 */
export function rangoEdadPermitido(rol: Rol): RangoEdad {
  return rol === 'joven' ? BANDA_EDAD_JOVEN : RANGO_EDAD_ESTANDAR
}
