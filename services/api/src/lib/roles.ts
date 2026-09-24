import type { RolUsuario } from '@convencion/shared-types'

export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ReglaRuta {
  metodo: MetodoHttp
  patron: string
}

export const RUTAS_CAMPO: ReglaRuta[] = [
  { metodo: 'GET', patron: '/inscripciones' },
  { metodo: 'POST', patron: '/inscripciones' },
  { metodo: 'GET', patron: '/inscripciones/*' },
  { metodo: 'POST', patron: '/checkin' }
]

export const RUTAS_ADMIN: ReglaRuta[] = [
  { metodo: 'POST', patron: '/pagos/revisar' },
  { metodo: 'GET', patron: '/pagos/*' },
  { metodo: 'POST', patron: '/equipos/generar' },
  { metodo: 'POST', patron: '/equipos/bloquear' },
  { metodo: 'POST', patron: '/equipos/config' },
  { metodo: 'GET', patron: '/equipos' },
  { metodo: 'GET', patron: '/equipos/*' }
]

export const RUTAS_POR_ROL: Record<RolUsuario, ReglaRuta[]> = {
  staff: RUTAS_CAMPO,
  admin: [...RUTAS_CAMPO, ...RUTAS_ADMIN]
}

export function esRutaPermitida(rol: RolUsuario, metodo: string, ruta: string): boolean {
  const rutas = RUTAS_POR_ROL[rol] ?? []
  return rutas.some((regla) => regla.metodo === metodo && coincidePatron(regla.patron, ruta))
}

function coincidePatron(patron: string, ruta: string): boolean {
  if (patron.endsWith('*')) {
    const prefijo = patron.slice(0, -1)
    return ruta.startsWith(prefijo)
  }
  return ruta === patron
}