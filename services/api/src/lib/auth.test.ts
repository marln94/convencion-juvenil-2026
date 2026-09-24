import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { Hono } from 'hono'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  requireAuth,
  rolDesdeGrupos,
  sesionDesdeToken,
  verificarToken,
  type ProveedorClaves
} from './auth.js'
import { RUTAS_POR_ROL, esRutaPermitida } from './roles.js'

delete process.env.AUTH_BYPASS_DEV
delete process.env.AUTH_BYPASS_ROL

describe('rolDesdeGrupos / sesionDesdeToken', () => {
  it('deriva admin si el grupo admin está presente', () => {
    expect(rolDesdeGrupos(['staff', 'admin'])).toBe('admin')
  })

  it('deriva staff desde el grupo staff', () => {
    expect(rolDesdeGrupos(['staff'])).toBe('staff')
  })

  it('devuelve null sin grupos o con grupos desconocidos', () => {
    expect(rolDesdeGrupos(undefined)).toBeNull()
    expect(rolDesdeGrupos([])).toBeNull()
    expect(rolDesdeGrupos(['visitante'])).toBeNull()
  })

  it('sesionDesdeToken lee el claim cognito:groups y la expiración', () => {
    const sesion = sesionDesdeToken({ 'cognito:groups': ['admin'], exp: 1_800_000 } as never)
    expect(sesion).toEqual({ rol: 'admin', grupos: ['admin'], expiraEn: 1_800_000 })
  })

  it('sesionDesdeToken devuelve null si no hay grupo', () => {
    expect(sesionDesdeToken({ exp: 123 } as never)).toBeNull()
  })
})

describe('matriz de roles', () => {
  it('permite a staff las rutas de campo', () => {
    expect(esRutaPermitida('staff', 'GET', '/inscripciones')).toBe(true)
    expect(esRutaPermitida('staff', 'POST', '/inscripciones')).toBe(true)
    expect(esRutaPermitida('staff', 'GET', '/inscripciones/abc-123')).toBe(true)
    expect(esRutaPermitida('staff', 'POST', '/checkin')).toBe(true)
  })

  it('niega a staff las rutas de administración', () => {
    expect(esRutaPermitida('staff', 'POST', '/pagos/revisar')).toBe(false)
    expect(esRutaPermitida('staff', 'GET', '/pagos/pendientes')).toBe(false)
    expect(esRutaPermitida('staff', 'POST', '/equipos/generar')).toBe(false)
    expect(esRutaPermitida('staff', 'POST', '/checkin-mal')).toBe(false)
  })

  it('permite a admin todo lo de campo y administración', () => {
    for (const regla of RUTAS_POR_ROL.admin ?? []) {
      const ruta = regla.patron.endsWith('*') ? `${regla.patron.slice(0, -1)}x` : regla.patron
      expect(esRutaPermitida('admin', regla.metodo, ruta)).toBe(true)
    }
  })

  it('admin ⊇ staff: admin ve al menos una ruta más', () => {
    const soloAdmin = (RUTAS_POR_ROL.admin ?? []).filter(
      (regla) =>
        !esRutaPermitida(
          'staff',
          regla.metodo,
          regla.patron.endsWith('*') ? `${regla.patron.slice(0, -1)}x` : regla.patron
        )
    )
    expect(soloAdmin.length).toBeGreaterThan(0)
  })
})

describe('verificarToken', () => {
  let firmarConGrupos: (grupos?: string[]) => Promise<string>
  let firmarOtraClave: () => Promise<string>
  let proveedor: ProveedorClaves
  let proveedorOtra: ProveedorClaves

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const { publicKey: otraPublica, privateKey: otraPrivada } = await generateKeyPair('RS256')

    proveedor = createLocalJWKSet({
      keys: [
        {
          ...(await exportJWK(publicKey)),
          alg: 'RS256',
          use: 'sig',
          kid: 'test-key'
        }
      ]
    })
    proveedorOtra = createLocalJWKSet({
      keys: [
        {
          ...(await exportJWK(otraPublica)),
          alg: 'RS256',
          use: 'sig',
          kid: 'test-key'
        }
      ]
    })

    firmarConGrupos = (grupos?: string[]) =>
      new SignJWT(grupos ? { 'cognito:groups': grupos } : {})
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey)
    firmarOtraClave = () =>
      new SignJWT({ 'cognito:groups': ['admin'] })
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(otraPrivada)
  })

  it('autentica un token con grupo admin', async () => {
    const resultado = await verificarToken(await firmarConGrupos(['admin']), proveedor)
    expect(resultado.estado).toBe('autenticado')
    if (resultado.estado === 'autenticado') {
      expect(resultado.sesion.rol).toBe('admin')
    }
  })

  it('autentica un token con grupo staff', async () => {
    const resultado = await verificarToken(await firmarConGrupos(['staff']), proveedor)
    if (resultado.estado === 'autenticado') {
      expect(resultado.sesion.rol).toBe('staff')
      expect(resultado.sesion.grupos).toEqual(['staff'])
      expect(resultado.sesion.expiraEn).toBeGreaterThan(0)
    } else {
      expect.unreachable()
    }
  })

  it('devuelve sin_rol si el token no trae cognito:groups', async () => {
    const resultado = await verificarToken(await firmarConGrupos(), proveedor)
    expect(resultado.estado).toBe('sin_rol')
  })

  it('rechaza un token firmado con otra clave', async () => {
    const resultado = await verificarToken(await firmarOtraClave(), proveedor)
    expect(resultado.estado).toBe('token_invalido')
  })

  it('rechaza un token que no es JWT', async () => {
    const resultado = await verificarToken('token-basura', proveedor)
    expect(resultado.estado).toBe('token_invalido')
  })

  it('reconoce la ausencia de token', async () => {
    expect(await verificarToken(undefined, proveedor)).toEqual({ estado: 'sin_token' })
  })
})

describe('requireAuth (middleware)', () => {
  let firmar: (grupos?: string[]) => Promise<string>
  let proveedor: ProveedorClaves
  let app: Hono

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    proveedor = createLocalJWKSet({
      keys: [
        {
          ...(await exportJWK(publicKey)),
          alg: 'RS256',
          use: 'sig',
          kid: 'test-key'
        }
      ]
    })
    firmar = (grupos?: string[]) =>
      new SignJWT(grupos ? { 'cognito:groups': grupos } : {})
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey)
  })

  beforeEach(() => {
    app = new Hono()
    app.use('*', requireAuth({ proveedorClaves: proveedor }))
    app.get('/inscripciones', (c) => c.json({ ok: true }))
    app.post('/inscripciones', (c) => c.json({ ok: true }))
    app.post('/checkin', (c) => c.json({ ok: true }))
    app.post('/pagos/revisar', (c) => c.json({ ok: true }))
    app.post('/equipos/generar', (c) => c.json({ ok: true }))
  })

  async function llamar(
    path: string,
    opciones: { metodo?: string; token?: string } = {}
  ): Promise<Response> {
    const { metodo = 'GET', token } = opciones
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return app.request(path, { method: metodo, headers })
  }

  it('responde 401 sin token', async () => {
    const res = await llamar('/checkin', { metodo: 'POST' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ message: 'Sesión no válida: se requiere un token de acceso' })
  })

  it('responde 401 con token inválido', async () => {
    const res = await llamar('/checkin', { metodo: 'POST', token: 'mal' })
    expect(res.status).toBe(401)
  })

  it('responde 403 si el token es válido pero sin grupo', async () => {
    const res = await llamar('/checkin', { metodo: 'POST', token: await firmar() })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ message: 'Tu cuenta no tiene acceso al sistema interno' })
  })

  it('permite 200 a staff en rutas de campo', async () => {
    const token = await firmar(['staff'])
    expect((await llamar('/inscripciones', { token })).status).toBe(200)
    expect((await llamar('/inscripciones', { metodo: 'POST', token })).status).toBe(200)
    expect((await llamar('/checkin', { metodo: 'POST', token })).status).toBe(200)
  })

  it('niega 403 a staff en rutas de administración', async () => {
    const token = await firmar(['staff'])
    const revisar = await llamar('/pagos/revisar', { metodo: 'POST', token })
    expect(revisar.status).toBe(403)
    expect(await revisar.json()).toEqual({
      message: 'No tienes permisos para realizar esta operación'
    })
    expect((await llamar('/equipos/generar', { metodo: 'POST', token })).status).toBe(403)
  })

  it('permite 200 a admin en rutas de campo y administración', async () => {
    const token = await firmar(['admin'])
    expect((await llamar('/checkin', { metodo: 'POST', token })).status).toBe(200)
    expect((await llamar('/pagos/revisar', { metodo: 'POST', token })).status).toBe(200)
    expect((await llamar('/equipos/generar', { metodo: 'POST', token })).status).toBe(200)
  })
})

describe('requireAuth con registro público (online)', () => {
  let proveedor: ProveedorClaves

  beforeAll(async () => {
    const { publicKey } = await generateKeyPair('RS256')
    proveedor = createLocalJWKSet({
      keys: [
        {
          ...(await exportJWK(publicKey)),
          alg: 'RS256',
          use: 'sig',
          kid: 'test-key'
        }
      ]
    })
  })

  function crearAppPublica(): Hono {
    const app = new Hono()
    app.use(
      '/inscripciones',
      requireAuth({ proveedorClaves: proveedor, permitirInscripcionOnline: true })
    )
    app.post('/inscripciones', async (c) => c.json({ ok: true }, 201))
    app.post('/inscripciones/comprobante-upload', async (c) => c.json({ ok: true }))
    return app
  }

  it('deja pasar el registro online anónimo', async () => {
    const app = crearAppPublica()
    const res = await app.request('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipoRegistro: 'online' })
    })
    expect(res.status).toBe(201)
  })

  it('exige token para el registro in situ', async () => {
    const app = crearAppPublica()
    const res = await app.request('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipoRegistro: 'in_situ' })
    })
    expect(res.status).toBe(401)
  })

  it('deja pasar comprobante-upload sin token (ruta pública)', async () => {
    const app = crearAppPublica()
    const res = await app.request('/inscripciones/comprobante-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: 'image/png' })
    })
    expect(res.status).toBe(200)
  })
})