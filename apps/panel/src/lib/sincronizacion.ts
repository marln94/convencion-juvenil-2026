import { useSyncExternalStore } from 'react'

import { api } from './api.js'
import { contarPendientes, sincronizarCola } from './cola.js'

let enLinea = navigator.onLine
let sincronizando = false
let conteoPendientes = 0

interface EstadoRed {
  enLinea: boolean
  sincronizando: boolean
  pendientes: number
}

let instantanea: EstadoRed = { enLinea, sincronizando, pendientes: conteoPendientes }

const subscriptores = new Set<() => void>()

function refrescarInstantanea(): void {
  instantanea = { enLinea, sincronizando, pendientes: conteoPendientes }
}

function emitir(): void {
  refrescarInstantanea()
  for (const subscriptor of subscriptores) {
    subscriptor()
  }
}

function cambiarEnLinea(valor: boolean): void {
  enLinea = valor
  emitir()
}

window.addEventListener('online', () => {
  cambiarEnLinea(true)
  void sincronizar()
})
window.addEventListener('offline', () => cambiarEnLinea(false))

export async function refrescarPendientes(): Promise<void> {
  conteoPendientes = await contarPendientes()
  emitir()
}

export async function sincronizar(): Promise<void> {
  if (!enLinea || sincronizando) return
  sincronizando = true
  emitir()
  try {
    await sincronizarCola(api)
  } finally {
    sincronizando = false
    await refrescarPendientes()
  }
}

export function suscribir(callback: () => void): () => void {
  subscriptores.add(callback)
  return () => subscriptores.delete(callback)
}

export function leerInstantanea(): EstadoRed {
  return instantanea
}

export function useEstadoRed(): EstadoRed {
  return useSyncExternalStore(suscribir, leerInstantanea)
}

void refrescarPendientes()
void sincronizar()