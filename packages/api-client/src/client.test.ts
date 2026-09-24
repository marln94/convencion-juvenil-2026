import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, createApiClient } from './index.js'

function jsonResponse(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function cabeceras(init: RequestInit | undefined): Headers {
  return new Headers((init?.headers ?? {}) as Record<string, string>)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createApiClient', () => {
  it('adjunta Authorization: Bearer cuando getToken devuelve un token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'ok' }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test', { getToken: () => 'tok-abc' })
    await api.listarParticipantes()

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/inscripciones')
    expect(cabeceras(init as RequestInit).get('Authorization')).toBe('Bearer tok-abc')
  })

  it('no envía Authorization cuando no hay getToken', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'ok' }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.listarParticipantes()

    const [, init] = fetchMock.mock.calls[0]!
    expect(cabeceras(init as RequestInit).has('Authorization')).toBe(false)
  })

  it('serializa filtros y paginación en el path de listarParticipantes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], pagination: {} }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.listarParticipantes({
      estadoPago: 'pendiente',
      tipoRegistro: 'in_situ',
      checkIn: false,
      limit: 25,
      nextToken: 'p-2'
    })

    const [url] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe(
      'https://api.example.test/inscripciones?estadoPago=pendiente&tipoRegistro=in_situ&checkIn=false&limit=25&nextToken=p-2'
    )
  })

  it('no agrega query string si no hay filtros', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], pagination: {} }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.listarParticipantes()

    const [url] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/inscripciones')
  })

  it('consulta la bandeja de pagos por estado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [] }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.listarBandejaPagos('pendiente')

    const [url] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/pagos/pendiente')
  })

  it('genera la asignación de equipos', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ asignacion: {}, porColor: {}, bloqueado: false }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.generarEquipos()

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/equipos/generar')
    expect((init as RequestInit).method).toBe('POST')
  })

  it('bloquea la asignación de equipos', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ bloqueado: true, fechaGeneracion: 'T' }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.bloquearEquipos()

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/equipos/bloquear')
    expect((init as RequestInit).method).toBe('POST')
  })

  it('actualiza los colores de equipos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ configId: 'equipos', colores: ['verde'] }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.configEquipos({ colores: ['verde'] })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/equipos/config')
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ colores: ['verde'] })
  })

  it('obtiene la asignación completa de equipos', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ asignacion: {}, porColor: {}, bloqueado: false }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.obtenerEquipos()

    const [url] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/equipos')
  })

  it('lista los integrantes de un color', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ color: 'rojo', items: [] }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')
    await api.listarIntegrantesDeEquipo('rojo')

    const [url] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/equipos/rojo')
  })

  it('invoca onUnauthorized ante 401 y lanza ApiError con el mensaje', async () => {
    const onUnauthorized = vi.fn()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: 'Sesión no válida' }, 401))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test', { onUnauthorized })

    await expect(api.obtenerParticipante('p-1')).rejects.toEqual(
      new ApiError(401, 'Sesión no válida')
    )
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('propaga 403 como error tipado sin invocar onUnauthorized', async () => {
    const onUnauthorized = vi.fn()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: 'No tienes permisos para realizar esta operación' }, 403))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test', { onUnauthorized })

    await expect(api.revisarPago({ participantId: 'p-1', decision: 'aprobar' })).rejects.toEqual(
      new ApiError(403, 'No tienes permisos para realizar esta operación')
    )
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('usa el mensaje del cuerpo para errores no 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Error interno' }, 500))
    vi.stubGlobal('fetch', fetchMock)

    const api = createApiClient('https://api.example.test')

    await expect(api.listarParticipantes()).rejects.toEqual(new ApiError(500, 'Error interno'))
  })
})