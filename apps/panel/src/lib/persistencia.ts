import { openDB, type IDBPDatabase } from 'idb'

export const NOMBRE_BASE_DATOS = 'panel'
export const VERSION_BASE_DATOS = 2

let baseDatos: IDBPDatabase | undefined

export async function obtenerBaseDatos(): Promise<IDBPDatabase> {
  if (!baseDatos) {
    baseDatos = await openDB(NOMBRE_BASE_DATOS, VERSION_BASE_DATOS, {
      upgrade(db, versionAnterior) {
        if (versionAnterior < 1) {
          db.createObjectStore('cola', { keyPath: 'id' })
          db.createObjectStore('indice', { keyPath: 'participantId' })
        }
        if (versionAnterior < 2) {
          // Operaciones que el servidor rechazó de forma definitiva. Se guardan
          // aparte de la cola porque no se van a reintentar: si vivieran en
          // 'cola' el contador de pendientes mentiría y la sincronización
          // seguiría chocando con ellas en cada intento.
          db.createObjectStore('descartadas', { keyPath: 'id' })
        }
      }
    })
  }
  return baseDatos
}

export function reiniciarBaseDatos(): void {
  baseDatos = undefined
}