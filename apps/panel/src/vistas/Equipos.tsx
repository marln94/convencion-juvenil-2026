import { ApiError } from '@convencion/api-client'
import type { EquiposAsignacionOutput, ResumenParticipante } from '@convencion/shared-types'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert, Button, Card, VistaHeader } from '@convencion/ui/components/ui'
import { api } from '../lib/api'
import { buscarEnIndice, actualizarEquiposEnIndice } from '../lib/indice'

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
      await actualizarEquiposEnIndice(resultado.asignacion)
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
      const equipos = await api.obtenerEquipos()
      await actualizarEquiposEnIndice(equipos.asignacion)
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
    <div className="container max-w-3xl">
      <VistaHeader
        titulo="Equipos"
        descripcion={asignacion?.bloqueado ? 'Asignación bloqueada' : 'Asignación por color'}
        acciones={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void generar()} disabled={procesando || asignacion?.bloqueado}>
              {procesando ? 'Generando…' : 'Generar'}
            </Button>
            <Button variant="outline" onClick={() => void bloquear()} disabled={bloqueando || asignacion?.bloqueado}>
              {bloqueando ? 'Bloqueando…' : 'Bloquear'}
            </Button>
            <Button variant="outline" onClick={exportarCsv} disabled={!asignacion}>
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()} disabled={!asignacion}>
              Imprimir
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {cargando ? <Alert variant="info">Cargando equipos…</Alert> : null}

      {asignacion?.bloqueado ? (
        <div className="mb-4">
          <Alert variant="warning">La asignación está bloqueada y ya no se puede regenerar.</Alert>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grupos.map(([color, ids]) => (
          <Card key={color}>
            <div className="flex items-center gap-2">
              <span
                className="size-4 rounded-full border border-[var(--color-border)]"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <h2 className="font-bold capitalize" style={{ color: 'var(--color-text)' }}>{color}</h2>
              <span className="ml-auto text-sm" style={{ color: 'var(--color-ink-soft)' }}>{ids.length}</span>
            </div>
            <ul className="mt-3 max-h-48 overflow-y-auto text-sm" style={{ color: 'var(--color-text)' }}>
              {ids.map((participantId) => (
                <li key={participantId} className="border-t border-[var(--color-border)] py-1">
                  {nombreDe(nombres, participantId)}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}