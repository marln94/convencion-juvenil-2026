import { fetchAuthSession, getCurrentUser, signIn, signOut } from '@aws-amplify/auth'
import { cognitoUserPoolsTokenProvider } from '@aws-amplify/auth/cognito'
import { Amplify } from '@aws-amplify/core'
import type { RolUsuario } from '@convencion/shared-types'

export interface SesionPanel {
  username: string
  rol: RolUsuario
}

export function configurarAutenticacion(): void {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID
  const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID
  if (!userPoolId || !userPoolClientId) {
    return
  }
  const cognito = { userPoolId, userPoolClientId }
  Amplify.configure(
    { Auth: { Cognito: cognito } },
    { Auth: { tokenProvider: cognitoUserPoolsTokenProvider } }
  )
  cognitoUserPoolsTokenProvider.setAuthConfig({ Cognito: cognito })
}

export function rolDesdeGrupos(grupos: string[] | undefined): RolUsuario | null {
  if (!grupos) return null
  if (grupos.includes('admin')) return 'admin'
  if (grupos.includes('staff')) return 'staff'
  return null
}

export async function obtenerSesion(): Promise<SesionPanel | null> {
  try {
    const usuario = await getCurrentUser()
    const grupos = await obtenerGrupos()
    const rol = rolDesdeGrupos(grupos)
    if (!rol) return null
    return { username: usuario.username, rol }
  } catch {
    return null
  }
}

export async function iniciarSesion(usuario: string, clave: string): Promise<void> {
  await signIn({ username: usuario, password: clave })
}

export async function cerrarSesion(): Promise<void> {
  await signOut()
}

export async function obtenerToken(): Promise<string | undefined> {
  try {
    const sesion = await fetchAuthSession({ forceRefresh: false })
    return sesion.tokens?.idToken?.toString()
  } catch {
    return undefined
  }
}

async function obtenerGrupos(): Promise<string[]> {
  const sesion = await fetchAuthSession({ forceRefresh: false })
  const grupos = sesion.tokens?.accessToken?.payload?.['cognito:groups']
  return Array.isArray(grupos) ? (grupos as string[]) : []
}