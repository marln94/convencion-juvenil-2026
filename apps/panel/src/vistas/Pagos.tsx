import { ApiError } from '@convencion/api-client'
import type { BandejaPagosItem, EstadoPago } from '@convencion/shared-types'
import { useCallback, useEffect, useState } from 'react'

import {
  Alerta,
  Boton,
  Campo,
  EncabezadoVista,
  Seleccion
} from '../componentes/ui'
import { api } from '../lib/api'

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
      await api.revisarPago({
        participantId: item.participantId,
        decision,
        motivoRechazo: decision === 'rechazar' ? motivo.trim() || undefined : undefined
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
    <div className="mx-auto w-full max-w-2xl">
      <EncabezadoVista
        titulo="Revisión de pagos"
        descripcion="Aprobá o rechazá los comprobantes"
        acciones={
          <div className="w-44">
            <Seleccion
              etiqueta="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoPago)}
            >
              {ESTADOS.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion === 'pendiente'
                    ? 'Pendientes'
                    : opcion === 'pagado'
                      ? 'Pagados'
                      : 'Rechazados'}
                </option>
              ))}
            </Seleccion>
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alerta tipo="error">{error}</Alerta>
        </div>
      ) : null}

      {cargando ? <Alerta tipo="info">Cargando bandeja…</Alerta> : null}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.participantId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{item.nombre}</p>
                <p className="text-xs text-slate-500">
                  Registro el {new Date(item.fechaRegistro).toLocaleString('es-HN')}
                </p>
                {item.correo ? (
                  <p className="text-sm text-slate-600">{item.correo}</p>
                ) : null}
              </div>
              <a
                href={item.vistaComprobanteUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${item.vistaComprobanteUrl ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}
                aria-disabled={!item.vistaComprobanteUrl}
              >
                Comprobante
              </a>
            </div>

            {item.estadoPago === 'pendiente' ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 no-print">
                <Boton
                  variante="exito"
                  disabled={procesando === item.participantId}
                  onClick={() => void decidir(item, 'aprobar')}
                >
                  Aprobar
                </Boton>
                <Boton
                  variante="peligro"
                  disabled={procesando === item.participantId}
                  onClick={() => {
                    setRechazando(rechazando?.participantId === item.participantId ? null : item)
                    setMotivo('')
                  }}
                >
                  Rechazar
                </Boton>
              </div>
            ) : (
              <p className="mt-2 text-sm font-medium text-slate-500">
                {item.estadoPago === 'pagado' ? 'Pago aprobado' : 'Pago rechazado'}
              </p>
            )}

            {rechazando?.participantId === item.participantId ? (
              <div className="mt-3 flex flex-col gap-2 no-print">
                <Campo
                  etiqueta="Motivo del rechazo"
                  placeholder="Opcional pero recomendable"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                <div className="flex gap-2">
                  <Boton
                    variante="peligro"
                    disabled={procesando === item.participantId}
                    onClick={() => void decidir(item, 'rechazar')}
                  >
                    Confirmar rechazo
                  </Boton>
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setRechazando(null)
                      setMotivo('')
                    }}
                  >
                    Cancelar
                  </Boton>
                </div>
              </div>
            ) : null}
          </li>
        ))}
        {!cargando && items.length === 0 ? (
          <li>
            <Alerta tipo="info">No hay comprobantes en este estado</Alerta>
          </li>
        ) : null}
      </ul>
    </div>
  )
}