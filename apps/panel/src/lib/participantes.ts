import type { ApiClient } from '@convencion/api-client'
import type { ResumenParticipante } from '@convencion/shared-types'

import { actualizarIndice } from './indice.js'

export async function cargarParticipantes(
  apiCliente: ApiClient
): Promise<ResumenParticipante[]> {
  const todos: ResumenParticipante[] = []
  let siguiente: string | undefined
  do {
    const pagina = await apiCliente.listarParticipantes({ limit: 500, nextToken: siguiente })
    todos.push(...pagina.items)
    siguiente = pagina.pagination.nextToken
  } while (siguiente !== undefined)
  await actualizarIndice(todos)
  return todos
}