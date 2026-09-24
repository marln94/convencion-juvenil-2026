import type { Sesion, RolUsuario } from '@convencion/shared-types'
import type { JWTPayload } from 'jose'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Context, MiddlewareHandler } from 'hono'

import { esRutaPermitida } from './roles.js'

const REGION_POR_DEFECTO = 'us-east-1'
const TTL_JWKS_MS = 60 * 60 * 1000

export type ProveedorClaves = Parameters<typeof jwtVerify>[1]

let jwksSet: ProveedorClaves | undefined
let jwksActualizadoEn = 0

export function rolDesdeGrupos(grupos: string[] | undefined): RolUsuario | null {
  if (!grupos) return null
  if (grupos.includes('admin')) return 'admin'
  if (grupos.includes('staff')) return 'staff'
  return null
}

export function sesionDesdeToken(payload: JWTPayload): Sesion | null {
  const conGrupos = payload as JWTPayload & { 'cognito:groups'?: unknown }
  const grupos = Array.isArray(conGrupos['cognito:groups'])
    ? (conGrupos['cognito:groups'] as string[])
    : undefined
  const rol = rolDesdeGrupos(grupos)
  if (!rol) return null
  return { rol, grupos: grupos ?? [], expiraEn: typeof payload.exp === 'number' ? payload.exp : 0 }
}

export type ResultadoVerificacion =
  | { estado: 'autenticado'; sesion: Sesion }
  | { estado: 'sin_token' }
  | { estado: 'token_invalido' }
  | { estado: 'sin_rol' }

export async function verificarToken(
  token: string | undefined,
  proveedorClaves?: ProveedorClaves
): Promise<ResultadoVerificacion> {
  if (!token) return { estado: 'sin_token' }
  try {
    const { payload } = await jwtVerify(token, proveedorClaves ?? obtenerProveedorClaves())
    const sesion = sesionDesdeToken(payload)
    return sesion ? { estado: 'autenticado', sesion } : { estado: 'sin_rol' }
  } catch {
    return { estado: 'token_invalido' }
  }
}

export interface OpcionesAuth {
  permitirInscripcionOnline?: boolean
  proveedorClaves?: ProveedorClaves
}

export function esBypassDesarrolloActivo(): boolean {
  return process.env.AUTH_BYPASS_DEV === 'true'
}

export function requireAuth(opciones: OpcionesAuth = {}): MiddlewareHandler {
  return async (c, next) => {
    if (opciones.permitirInscripcionOnline && (await esRegistroOnline(c))) {
      await next()
      return
    }

    let sesion: Sesion
    if (esBypassDesarrolloActivo()) {
      const rol = sesionDePrueba()
      if (!rol) {
        return c.json({ message: 'AUTH_BYPASS_ROL inválido' }, 500)
      }
      sesion = { rol, grupos: [rol], expiraEn: Number.MAX_SAFE_INTEGER }
    } else {
      const resultado = await verificarToken(
        tokenDesdeAutorizacion(c.req.header('authorization')),
        opciones.proveedorClaves
      )
      if (resultado.estado === 'sin_token' || resultado.estado === 'token_invalido') {
        return c.json({ message: 'Sesión no válida: se requiere un token de acceso' }, 401)
      }
      if (resultado.estado === 'sin_rol') {
        return c.json({ message: 'Tu cuenta no tiene acceso al sistema interno' }, 403)
      }
      sesion = resultado.sesion
    }

    if (!esRutaPermitida(sesion.rol, c.req.method, c.req.path)) {
      return c.json({ message: 'No tienes permisos para realizar esta operación' }, 403)
    }

    ;(c as ContextoConSesion).set('sesion', sesion)
    await next()
  }
}

interface ContextoConSesion extends Context<{ Variables: { sesion?: Sesion } }> {}

function sesionDePrueba(): RolUsuario | null {
  const rol = process.env.AUTH_BYPASS_ROL
  if (rol !== 'admin' && rol !== 'staff') return null
  return rol
}

async function esRegistroOnline(c: Context): Promise<boolean> {
  if (c.req.method !== 'POST') return false
  if (c.req.path !== '/inscripciones' && c.req.routePath !== '/inscripciones') return false
  try {
    const cuerpo = (await c.req.raw.clone().json()) as { tipoRegistro?: unknown }
    return cuerpo.tipoRegistro === 'online'
  } catch {
    return false
  }
}

function tokenDesdeAutorizacion(autorizacion: string | undefined): string | undefined {
  if (!autorizacion) return undefined
  const [esquema, token] = autorizacion.split(' ')
  return esquema?.toLowerCase() === 'bearer' && token ? token : undefined
}

function obtenerProveedorClaves(): ProveedorClaves {
  const ahora = Date.now()
  if (!jwksSet || ahora - jwksActualizadoEn > TTL_JWKS_MS) {
    jwksSet = createRemoteJWKSet(new URL(urlJwksDesdeConfig()))
    jwksActualizadoEn = ahora
  }
  return jwksSet
}

function urlJwksDesdeConfig(): string {
  const url = process.env.COGNITO_JWKS_URL
  if (url) return url
  const region = process.env.COGNITO_REGION ?? REGION_POR_DEFECTO
  const poolId = process.env.COGNITO_USER_POOL_ID
  if (!poolId) throw new Error('Falta COGNITO_USER_POOL_ID o COGNITO_JWKS_URL para autenticar')
  return `https://cognito-idp.${region}.amazonaws.com/${poolId}/.well-known/jwks.json`
}