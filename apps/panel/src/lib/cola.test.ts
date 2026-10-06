import 'fake-indexeddb/auto'
import { deleteDB, openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, type ApiClient } from '@convencion/api-client'
import type { ResumenParticipante } from '@convencion/shared-types'

import {
  contarDescartadas,
  contarPendientes,
  crearIdCola,
  encolarOperacion,
  listarDescartadas,
  sincronizarCola,
  type RegistroInsituEnCola
} from './cola.js'
import { agregarAlIndice } from './indice.js'
import { NOMBRE_BASE_DATOS, obtenerBaseDatos, reiniciarBaseDatos } from './persistencia.js'

const PARTICIPANTE = '11111111-1111-4111-8111-111111111111'
const OTRO = '22222222-2222-4222-8222-222222222222'

function registroInSitu(participantId: string): RegistroInsituEnCola {
  return {
    nombre: 'Ana Pérez',
    localidad: 'Tegucigalpa',
    region: '1',
    edad: 25,
    diasAsistencia: ['jueves-24'],
    rol: 'joven',
    tipoRegistro: 'in_situ',
    participantId
  }
}

function clienteQueFalla(error: unknown): ApiClient {
  return {
    registrarParticipante: vi.fn().mockRejectedValue(error),
    checkIn: vi.fn().mockRejectedValue(error)
  } as unknown as ApiClient
}

function clienteQueAcepta(): ApiClient {
  return {
    registrarParticipante: vi.fn().mockResolvedValue({}),
    checkIn: vi.fn().mockResolvedValue({})
  } as unknown as ApiClient
}

function resumen(participantId: string): ResumenParticipante {
  return {
    participantId,
    nombre: 'Ana Pérez',
    estadoPago: 'pendiente',
    fechaRegistro: '2026-09-01T00:00:00.000Z',
    tipoRegistro: 'in_situ',
    checkIn: false
  }
}

beforeEach(async () => {
  reiniciarBaseDatos()
  const db = await obtenerBaseDatos()
  // La base es la misma entre tests, así que cada uno arranca vacío.
  await Promise.all([db.clear('cola'), db.clear('descartadas'), db.clear('indice')])
})

afterEach(async () => {
  const db = await obtenerBaseDatos()
  db.close()
  reiniciarBaseDatos()
})

describe('sincronizarCola', () => {
  it('descarta un 400 y sigue con la siguiente operación', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))
    await encolarOperacion('registro_insitu', registroInSitu(OTRO))

    const api = clienteQueFalla(new ApiError(400, 'Edad no permitida'))
    await sincronizarCola(api)

    // Lo relevante es que el loop no se detuvo en el primero.
    expect(api.registrarParticipante).toHaveBeenCalledTimes(2)
    expect(await contarPendientes()).toBe(0)
    expect(await contarDescartadas()).toBe(2)
  })

  it('registra el motivo del rechazo en descartadas', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))

    await sincronizarCola(clienteQueFalla(new ApiError(400, 'Edad no permitida')))

    const [descartada] = await listarDescartadas()
    expect(descartada?.status).toBe(400)
    expect(descartada?.motivo).toBe('Edad no permitida')
    expect(descartada?.tipo).toBe('registro_insitu')
  })

  it('descarta un 409 sin perder el resto de la cola', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))

    await sincronizarCola(clienteQueFalla(new ApiError(409, 'El participante ya existe')))

    expect(await contarPendientes()).toBe(0)
    expect(await contarDescartadas()).toBe(1)
  })

  it('quita del índice local el registro descartado', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))
    await agregarAlIndice(resumen(PARTICIPANTE))

    await sincronizarCola(clienteQueFalla(new ApiError(400, 'Edad no permitida')))

    const db = await obtenerBaseDatos()
    expect(await db.get('indice', PARTICIPANTE)).toBeUndefined()
  })

  it('no toca el índice cuando se descarta un checkin', async () => {
    await encolarOperacion('checkin', { participantId: PARTICIPANTE })
    await agregarAlIndice(resumen(PARTICIPANTE))

    await sincronizarCola(
      clienteQueFalla(new ApiError(404, 'El código no corresponde a un participante'))
    )

    const db = await obtenerBaseDatos()
    expect(await db.get('indice', PARTICIPANTE)).toBeDefined()
  })

  it('descarta un 404 sin cortar el loop', async () => {
    await encolarOperacion('checkin', { participantId: PARTICIPANTE })

    const api = clienteQueFalla(new ApiError(404, 'El código no corresponde a un participante'))
    await sincronizarCola(api)

    expect(api.checkIn).toHaveBeenCalledTimes(1)
    expect(await contarPendientes()).toBe(0)
  })

  it('deja la operación en cola ante un 500 y no procesa las siguientes', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))
    await encolarOperacion('registro_insitu', registroInSitu(OTRO))

    const api = clienteQueFalla(new ApiError(500, 'Error interno del servidor'))
    await sincronizarCola(api)

    // El break preserva el orden: la segunda sigue sin intentar.
    expect(api.registrarParticipante).toHaveBeenCalledTimes(1)
    expect(await contarPendientes()).toBe(2)
    expect(await contarDescartadas()).toBe(0)
  })

  it('deja la operación en cola ante un corte de red', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))

    await sincronizarCola(clienteQueFalla(new TypeError('Failed to fetch')))

    expect(await contarPendientes()).toBe(1)
    expect(await contarDescartadas()).toBe(0)
  })

  it('deja la operación en cola ante un 403, por si la sesión se renueva', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))

    await sincronizarCola(clienteQueFalla(new ApiError(403, 'No autorizado')))

    expect(await contarPendientes()).toBe(1)
    expect(await contarDescartadas()).toBe(0)
  })

  it('vacía la cola cuando todo se sincroniza', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))
    await encolarOperacion('checkin', { participantId: PARTICIPANTE })

    await sincronizarCola(clienteQueAcepta())

    expect(await contarPendientes()).toBe(0)
    expect(await contarDescartadas()).toBe(0)
  })

  it('no vuelve a intentar una operación ya descartada', async () => {
    await encolarOperacion('registro_insitu', registroInSitu(PARTICIPANTE))
    const api = clienteQueFalla(new ApiError(400, 'Edad no permitida'))

    await sincronizarCola(api)
    await sincronizarCola(api)

    expect(api.registrarParticipante).toHaveBeenCalledTimes(1)
  })
})

describe('persistencia: upgrade a la v2', () => {
  it('crea cola, índice y descartadas en una base nueva', async () => {
    const db = await obtenerBaseDatos()
    expect([...db.objectStoreNames].sort()).toEqual(['cola', 'descartadas', 'indice'])
  })

  it('agrega descartadas sin perder la cola ni el índice de una base v1', async () => {
    // Se parte de una base v1 real y se deja que `obtenerBaseDatos` ejecute el
    // upgrade real, en vez de simularlo.
    const db = await obtenerBaseDatos()
    db.close()
    reiniciarBaseDatos()
    await deleteDB(NOMBRE_BASE_DATOS)

    const v1 = await openDB(NOMBRE_BASE_DATOS, 1, {
      upgrade(db) {
        db.createObjectStore('cola', { keyPath: 'id' })
        db.createObjectStore('indice', { keyPath: 'participantId' })
      }
    })
    await v1.put('cola', {
      id: crearIdCola(),
      tipo: 'checkin',
      payload: { participantId: PARTICIPANTE },
      creadoEn: new Date().toISOString()
    })
    await v1.put('indice', resumen(PARTICIPANTE))
    v1.close()

    const v2 = await obtenerBaseDatos()
    try {
      expect([...v2.objectStoreNames].sort()).toEqual(['cola', 'descartadas', 'indice'])
      expect(await v2.count('cola')).toBe(1)
      expect(await v2.count('indice')).toBe(1)
    } finally {
      v2.close()
      reiniciarBaseDatos()
    }
  })
})
