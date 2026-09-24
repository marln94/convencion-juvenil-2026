import { ApiError } from '@convencion/api-client'
import type { EquiposAsignacionOutput, ResumenParticipante } from '@convencion/shared-types'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alerta, Boton, EncabezadoVista } from '../componentes/ui'
import { api } from '../lib/api'
import { buscarEnIndice } from '../lib/indice'

function nombreDe(indice: Map<string, string>, participantId: string): string {
  return indice.get(participantId) ?? participantId
}

export function VistaEquipos() {
  const [asignacion, setAsignacion] = useState<EquiposAsignacionOutput | null>(null)
  const [nombres, setNombres] = useState<Map<string, string>>(new Map())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [bloqueando, setBloqueando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [equipos, indice] = await Promise.all([api.obtenerEquipos(), buscarEnIndice('')])
      setAsignacion(equipos)
      setNombres(new Map(indice.map((i: ResumenParticipante) => [i.participantId, i.nombre])))
    } catch (causa) {
      if (causa instanceof ApiError) {
        setError(causa.message)
      } else {
        setError('Error al cargar los equipos')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const grupos = useMemo(
    () => (asignacion ? Object.entries(asignacion.porColor) : []),
    [asignacion]
  )

  const generar = async () => {
    if (!window.confirm('¿Generar la asignación aleatoria de equipos? Esta acción no se puede deshacer.')) {
      return
    }
    setProcesando(true)
    setError(null)
    try {
      const resultado = await api.generarEquipos()
      setAsignacion(resultado)
      const indice = await buscarEnIndice('')
      setNombres(new Map(indice.map((i: ResumenParticipante) => [i.participantId, i.nombre])))
    } catch (causa) {
      if (causa instanceof ApiError) {
        setError(causa.message)
      } else {
        setError('Error al generar la asignación')
      }
    } finally {
      setProcesando(false)
    }
  }

  const bloquear = async () => {
    setBloqueando(true)
    setError(null)
    try {
      await api.bloquearEquipos()
      await cargar()
    } catch (causa) {
      if (causa instanceof ApiError) {
        setError(causa.message)
      } else {
        setError('Error al bloquear la asignación')
      }
    } finally {
      setBloqueando(false)
    }
  }

  const exportarCsv = () => {
    if (!asignacion) return
    const filas = Object.entries(asignacion.asignacion).map(
      ([participantId, equipoColor]) => `${nombreDe(nombres, participantId)},${equipoColor}`
    )
    const blob = new Blob([`nombre,equipo\n${filas.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'equipos.csv'
    enlace.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <EncabezadoVista
        titulo="Equipos"
        descripcion={asignacion?.bloqueado ? 'Asignación bloqueada' : 'Asignación por color'}
        acciones={
          <div className="flex flex-wrap gap-2">
            <Boton onClick={() => void generar()} disabled={procesando || asignacion?.bloqueado}>
              {procesando ? 'Generando…' : 'Generar'}
            </Boton>
            <Boton variante="secundario" onClick={() => void bloquear()} disabled={bloqueando || asignacion?.bloqueado}>
              {bloqueando ? 'Bloqueando…' : 'Bloquear'}
            </Boton>
            <Boton variante="secundario" onClick={exportarCsv} disabled={!asignacion}>
              Exportar CSV
            </Boton>
            <Boton variante="secundario" onClick={() => window.print()} disabled={!asignacion}>
              Imprimir
            </Boton>
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alerta tipo="error">{error}</Alerta>
        </div>
      ) : null}

      {cargando ? <Alerta tipo="info">Cargando equipos…</Alerta> : null}

      {asignacion?.bloqueado ? (
        <div className="mb-4">
          <Alerta tipo="aviso">La asignación está bloqueada y ya no se puede regenerar.</Alerta>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grupos.map(([color, ids]) => (
          <div key={color} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span
                className="size-4 rounded-full border border-slate-300"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <h2 className="font-bold capitalize text-slate-900">{color}</h2>
              <span className="ml-auto text-sm text-slate-500">{ids.length}</span>
            </div>
            <ul className="mt-3 max-h-48 overflow-y-auto text-sm text-slate-700">
              {ids.map((participantId) => (
                <li key={participantId} className="border-t border-slate-100 py-1">
                  {nombreDe(nombres, participantId)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}