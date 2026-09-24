export type RolUsuario = 'admin' | 'staff'

export interface Sesion {
  rol: RolUsuario
  grupos: string[]
  expiraEn: number
}