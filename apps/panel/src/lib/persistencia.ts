import { openDB, type IDBPDatabase } from 'idb'

export const NOMBRE_BASE_DATOS = 'panel'
export const VERSION_BASE_DATOS = 1

let baseDatos: IDBPDatabase | undefined

export async function obtenerBaseDatos(): Promise<IDBPDatabase> {
  if (!baseDatos) {
    baseDatos = await openDB(NOMBRE_BASE_DATOS, VERSION_BASE_DATOS, {
      upgrade(db) {
        db.createObjectStore('cola', { keyPath: 'id' })
        db.createObjectStore('indice', { keyPath: 'participantId' })
      }
    })
  }
  return baseDatos
}