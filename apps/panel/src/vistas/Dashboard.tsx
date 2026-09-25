import { ApiError } from '@convencion/api-client'
import type { ResumenParticipante } from '@convencion/shared-types'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert, Button, Card, Container, Input, Pill, Section, VistaHeader } from '@convencion/ui/components/ui'
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
    llegados: items.filter((item) => item.checkIn).length,
  }
}

const ESTADISTICAS_CONFIG = [
  { key: 'inscritos' as keyof Estadisticas, label: 'Inscritos', variant: 'default' as const },
  { key: 'pagados' as keyof Estadisticas, label: 'Pagados', variant: 'green' as const },
  { key: 'pendientes' as keyof Estadisticas, label: 'Pendientes', variant: 'amber' as const },
  { key: 'inSitu' as keyof Estadisticas, label: 'In situ', variant: 'default' as const },
  { key: 'llegados' as keyof Estadisticas, label: 'Llegados', variant: 'default' as const },
] as const

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
    <Container>
      <Section className="py-0">
      <VistaHeader
        titulo="Dashboard"
        descripcion="Resumen de inscripción y llegadas"
        acciones={<Button variant="outline" onClick={() => void cargar()}>Actualizar</Button>}
      />

      {error ? (
        <div className="mb-4">
          <Alert variant={navigator.onLine ? 'error' : 'warning'}>
            {error}
          </Alert>
        </div>
      ) : null}

      {cargando ? <Alert variant="info">Cargando datos…</Alert> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 mb-6">
        {ESTADISTICAS_CONFIG.map((config) => (
          <Card key={config.key} className="text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              {estadisticas[config.key]}
            </p>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--color-ink-soft)' }}>
              {config.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="mb-4">
        <Input
          label="Buscar por nombre"
          placeholder="Escribí para filtrar…"
          value={filtro}
          onChange={setFiltro}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {resultados.map((participante) => (
          <Card key={participante.participantId} className="flex items-center justify-between gap-3 p-3">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
              {participante.nombre}
            </span>
            <div className="flex gap-2">
              <Pill variant={participante.estadoPago === 'pagado' ? 'green' : participante.estadoPago === 'pendiente' ? 'amber' : 'red'}>
                {participante.estadoPago === 'pagado' ? 'Pagado' : participante.estadoPago === 'pendiente' ? 'Pendiente' : 'Rechazado'}
              </Pill>
              <Pill variant={participante.checkIn ? 'green' : 'default'}>
                {participante.checkIn ? 'Llegó' : 'No llegó'}
              </Pill>
            </div>
          </Card>
        ))}
        {filtro.trim() && resultados.length === 0 && (
          <li>
            <Alert variant="info">Sin coincidencias</Alert>
          </li>
        )}
      </ul>
      </Section>
    </Container>
  )
}