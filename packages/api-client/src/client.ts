export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface OpcionesCliente {
  getToken?: () => string | Promise<string | undefined> | undefined
  onUnauthorized?: () => void | Promise<void>
}

export async function request<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
  opciones: OpcionesCliente = {}
): Promise<T> {
  const token = await opciones.getToken?.()
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) {
        message = body.message
      }
    } catch {
      // cuerpo no JSON: se conserva el mensaje por defecto
    }
    if (res.status === 401) {
      await opciones.onUnauthorized?.()
    }
    throw new ApiError(res.status, message)
  }

  return (await res.json()) as T
}