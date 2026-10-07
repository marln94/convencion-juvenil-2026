import { ApiError } from '@convencion/api-client'
import type { EquiposAsignacionOutput, ResumenParticipante } from '@convencion/shared-types'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert, Button, Card, VistaHeader } from '@convencion/ui/components/ui'
import { hexPorNombre, textoSobreColor } from '../lib/equipos'
import { EquipoChip } from '../lib/equipo-chip'
import { actualizarEquiposEnIndice, buscarEnIndice } from '../lib/indice'
import { api } from '../lib/api'

function nombreDe(indice: Map<string, string>, participantId: string): string {
  return indice.get(participantId) ?? participantId
}

export function VistaEquipos() {
  const [asignacion, setAsignacion] = useState<EquiposAsignacionOutput | null>(null)
  const [nombres, setNombres] = useState<Map<string, string>>(new Map())
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moviendo, setMoviendo] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [equipos, indice] = await Promise.all([api.obtenerEquipos(), buscarEnIndice('')])
      setAsignacion(equipos)
      setNombres(new Map(indice.map((i: ResumenParticipante) => [i.participantId, i.nombre])))
      setTotal(indice.length)
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

  const equipos = useMemo(() => {
    if (!asignacion) return []
    return Object.entries(asignacion.conteos).map(([nombre, conteo]) => ({
      nombre,
      conteo,
      ids: asignacion.porColor[nombre] ?? []
    }))
  }, [asignacion])

  const asignados = useMemo(() => {
    if (!asignacion) return 0
    return Object.values(asignacion.conteos).reduce((suma, n) => suma + n, 0)
  }, [asignacion])
  const sinEquipo = Math.max(total - asignados, 0)

  const mover = async (participantId: string, equipoColor: string) => {
    setMoviendo(participantId)
    setError(null)
    try {
      await api.asignarEquipo({ participantId, equipoColor })
      const equipos = await api.obtenerEquipos()
      await actualizarEquiposEnIndice(equipos.asignacion)
      await cargar()
    } catch (causa) {
      if (causa instanceof ApiError) {
        setError(causa.message)
      } else {
        setError('Error al mover al participante')
      }
    } finally {
      setMoviendo(null)
    }
  }

  const exportarCsv = () => {
    if (!asignacion) return
    const filas: string[] = []
    for (const [participantId, equipoColor] of Object.entries(asignacion.asignacion)) {
      filas.push(`${nombreDe(nombres, participantId)},"${equipoColor}",${hexPorNombre(equipoColor) ?? ''}`)
    }
    const blob = new Blob([`nombre,equipo,color\n${filas.join('\n')}`], {
      type: 'text/csv;charset=utf-8'
    })
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
        descripcion="Asignación por equipo durante el registro y el check-in"
        acciones={
          <div className="flex flex-wrap gap-2">
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

      {!cargando && asignacion ? (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span style={{ color: 'var(--color-text)' }}>
              <strong>{asignados}</strong> asignados
            </span>
            <span style={{ color: 'var(--color-ink-soft)' }}>de {total} participantes</span>
            <span className="ml-auto flex items-center gap-2">
              <EquipoChip />
              {sinEquipo} sin equipo
            </span>
          </div>
          {total > 0 ? (
            <div
              className="mt-3 h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--color-paper-light)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((asignados / total) * 100, 100)}%`,
                  background: 'var(--color-accent)'
                }}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {equipos.map(({ nombre, conteo, ids }) => {
          const hex = hexPorNombre(nombre)
          return (
            <Card key={nombre}>
              <div className="flex items-center gap-2">
                <span
                  className="size-4 rounded-full border border-[var(--color-border)]"
                  style={{ backgroundColor: hex, borderColor: hex === '#FFFFFF' ? 'var(--color-border)' : 'rgba(0,0,0,0.08)' }}
                  aria-hidden="true"
                />
                <span
                  className="rounded-full px-2 py-0.5 text-sm font-bold"
                  style={{ background: hex, color: textoSobreColor(hex ?? '#FFFFFF'), border: hex === '#FFFFFF' ? '1px solid var(--color-border)' : 'none' }}
                >
                  {nombre}
                </span>
                <span className="ml-auto text-sm" style={{ color: 'var(--color-ink-soft)' }}>{conteo}</span>
              </div>
              <ul className="mt-3 max-h-48 overflow-y-auto text-sm" style={{ color: 'var(--color-text)' }}>
                {ids.map((participantId) => (
                  <li
                    key={participantId}
                    className="flex items-center gap-2 border-t border-[var(--color-border)] py-1"
                  >
                    <span className="min-w-0 flex-1 truncate">{nombreDe(nombres, participantId)}</span>
                    <select
                      className="shrink-0 rounded px-1 py-0.5 text-xs"
                      style={{ background: 'var(--color-paper-light)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                      value={nombre}
                      disabled={moviendo !== null}
                      aria-label={`Mover a ${nombreDe(nombres, participantId)} a otro equipo`}
                      onChange={(e) => void mover(participantId, e.target.value)}
                    >
                      {equipos.map((otros) => (
                        <option key={otros.nombre} value={otros.nombre}>
                          {otros.nombre === nombre ? `${otros.nombre} (base)` : otros.nombre}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
    </div>
  )
}