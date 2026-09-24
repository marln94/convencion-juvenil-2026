import { ApiError } from '@convencion/api-client'
import type { ResumenParticipante } from '@convencion/shared-types'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alerta, Boton, Campo, EncabezadoVista, PillCheckIn, PillPago } from '../componentes/ui'
import { api } from '../lib/api'
import { buscarEnIndice } from '../lib/indice'
import { cargarParticipantes } from '../lib/participantes'

interface Estadisticas {
  inscritos: number
  pagados: number
  pendientes: number
  inSitu: number
  llegados: number
}

function calcularEstadisticas(items: ResumenParticipante[]): Estadisticas {
  return {
    inscritos: items.length,
    pagados: items.filter((item) => item.estadoPago === 'pagado').length,
    pendientes: items.filter((item) => item.estadoPago === 'pendiente').length,
    inSitu: items.filter((item) => item.tipoRegistro === 'in_situ').length,
    llegados: items.filter((item) => item.checkIn).length
  }
}

const TARJETAS: { clave: keyof Estadisticas; etiqueta: string; estilo: string }[] = [
  { clave: 'inscritos', etiqueta: 'Inscritos', estilo: 'text-slate-900' },
  { clave: 'pagados', etiqueta: 'Pagados', estilo: 'text-emerald-600' },
  { clave: 'pendientes', etiqueta: 'Pendientes', estilo: 'text-amber-600' },
  { clave: 'inSitu', etiqueta: 'In situ', estilo: 'text-sky-600' },
  { clave: 'llegados', etiqueta: 'Llegados', estilo: 'text-indigo-600' }
]

export function VistaDashboard() {
  const [todos, setTodos] = useState<ResumenParticipante[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [resultados, setResultados] = useState<ResumenParticipante[]>([])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const items = await cargarParticipantes(api)
      setTodos(items)
    } catch (causa) {
      if (causa instanceof ApiError) {
        setError(causa.message)
      } else if (!navigator.onLine) {
        setError('Sin conexión: se muestran los datos locales disponibles')
      } else {
        setError('Error al cargar los participantes')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (!filtro.trim()) {
      setResultados([])
      return
    }
    void buscarEnIndice(filtro).then((coincidencias) => setResultados(coincidencias.slice(0, 30)))
  }, [filtro])

  const estadisticas = useMemo(() => calcularEstadisticas(todos), [todos])

  return (
    <div className="mx-auto w-full max-w-2xl">
      <EncabezadoVista
        titulo="Dashboard"
        descripcion="Resumen de inscripción y llegadas"
        acciones={<Boton onClick={() => void cargar()}>Actualizar</Boton>}
      />

      {error ? (
        <div className="mb-4">
          <Alerta tipo={navigator.onLine ? 'error' : 'aviso'}>{error}</Alerta>
        </div>
      ) : null}

      {cargando ? <Alerta tipo="info">Cargando datos…</Alerta> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {TARJETAS.map((tarjeta) => (
          <div
            key={tarjeta.clave}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className={`text-3xl font-bold ${tarjeta.estilo}`}>{estadisticas[tarjeta.clave]}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{tarjeta.etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Campo
          etiqueta="Buscar por nombre"
          placeholder="Escribí para filtrar…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <ul className="mt-3 flex flex-col gap-2">
          {resultados.map((participante) => (
            <li
              key={participante.participantId}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <span className="block font-semibold text-slate-900">{participante.nombre}</span>
              <span className="mt-1 flex flex-wrap gap-2">
                <PillPago estadoPago={participante.estadoPago} />
                <PillCheckIn checkIn={participante.checkIn} />
              </span>
            </li>
          ))}
          {filtro.trim() && resultados.length === 0 ? (
            <li>
              <Alerta tipo="info">Sin coincidencias</Alerta>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}