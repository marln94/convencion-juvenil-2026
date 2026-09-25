import { ApiError } from '@convencion/api-client'
import type { BandejaPagosItem, EstadoPago } from '@convencion/shared-types'
import { useCallback, useEffect, useState } from 'react'

import { Alert, Button, Card, Container, Input, Pill, Section, Select, VistaHeader } from '@convencion/ui/components/ui'
import { api } from '../lib/api'
import { agregarAlIndice } from '../lib/indice'

const ESTADOS: EstadoPago[] = ['pendiente', 'pagado', 'rechazado']

export function VistaPagos() {
  const [estado, setEstado] = useState<EstadoPago>('pendiente')
  const [items, setItems] = useState<BandejaPagosItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<BandejaPagosItem | null>(null)
  const [motivo, setMotivo] = useState('')
  const [procesando, setProcesando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const bandeja = await api.listarBandejaPagos(estado)
      setItems(bandeja.items)
    } catch (causa) {
      if (causa instanceof ApiError) {
        setError(causa.message)
      } else {
        setError('Error al cargar la bandeja de pagos')
      }
    } finally {
      setCargando(false)
    }
  }, [estado])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const decidir = async (item: BandejaPagosItem, decision: 'aprobar' | 'rechazar') => {
    setProcesando(item.participantId)
    setError(null)
    try {
      const resultado = await api.revisarPago({
        participantId: item.participantId,
        decision,
        motivoRechazo: decision === 'rechazar' ? motivo.trim() || undefined : undefined,
      })
      await agregarAlIndice({
        participantId: item.participantId,
        nombre: item.nombre,
        estadoPago: resultado.participante.estadoPago,
        equipoColor: resultado.participante.equipoColor,
        checkIn: resultado.participante.checkIn,
      })
      setRechazando(null)
      setMotivo('')
      await cargar()
    } catch (causa) {
      if (causa instanceof ApiError) {
        setError(causa.message)
      } else {
        setError('Error al guardar la decisión')
      }
    } finally {
      setProcesando(null)
    }
  }

  return (
    <Container>
      <Section className="py-0">
      <VistaHeader
        titulo="Revisión de pagos"
        descripcion="Aprobá o rechazá los comprobantes"
        acciones={
          <div style={{ width: '176px' }}>
            <Select
              label="Estado"
              value={estado}
              onChange={(v) => setEstado(v as EstadoPago)}
              options={[
                ['pendiente', 'Pendientes'],
                ['pagado', 'Pagados'],
                ['rechazado', 'Rechazados'],
              ]}
            />
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {cargando ? <Alert variant="info">Cargando bandeja…</Alert> : null}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.participantId}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                  Registro el {new Date(item.fechaRegistro).toLocaleString('es-HN')}
                </p>
                {item.correo ? (
                  <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>{item.correo}</p>
                ) : null}
              </div>
              <a
                href={item.vistaComprobanteUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${item.vistaComprobanteUrl ? 'bg-[var(--color-accent)] text-white hover:opacity-90' : 'cursor-not-allowed bg-[var(--color-border)] text-[var(--color-ink-soft)]'}`}
                aria-disabled={!item.vistaComprobanteUrl}
              >
                Comprobante
              </a>
            </div>

            {item.estadoPago === 'pendiente' ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 no-print">
                <Button
                  variant="primary"
                  disabled={procesando === item.participantId}
                  onClick={() => void decidir(item, 'aprobar')}
                >
                  Aprobar
                </Button>
                <Button
                  variant="outline"
                  disabled={procesando === item.participantId}
                  onClick={() => {
                    setRechazando(rechazando?.participantId === item.participantId ? null : item)
                    setMotivo('')
                  }}
                >
                  Rechazar
                </Button>
              </div>
            ) : (
              <Pill
                className="mt-2"
                variant={item.estadoPago === 'pagado' ? 'green' : 'red'}
              >
                {item.estadoPago === 'pagado' ? 'Pago aprobado' : 'Pago rechazado'}
              </Pill>
            )}

            {rechazando?.participantId === item.participantId ? (
              <div className="mt-3 flex flex-col gap-2 no-print">
                <Input
                  label="Motivo del rechazo"
                  placeholder="Opcional pero recomendable"
                  value={motivo}
                  onChange={setMotivo}
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    disabled={procesando === item.participantId}
                    onClick={() => void decidir(item, 'rechazar')}
                  >
                    Confirmar rechazo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRechazando(null)
                      setMotivo('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        ))}
        {!cargando && items.length === 0 && (
          <li>
            <Alert variant="info">No hay comprobantes en este estado</Alert>
          </li>
        )}
      </ul>
      </Section>
    </Container>
  )
}