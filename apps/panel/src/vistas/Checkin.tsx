import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import type { Participante, ResumenParticipante } from '@convencion/shared-types'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  Alerta,
  Boton,
  Campo,
  EncabezadoVista,
  PillCheckIn,
  PillPago
} from '../componentes/ui'
import { api } from '../lib/api'
import { encolarOperacion } from '../lib/cola'
import { agregarAlIndice, buscarEnIndice, obtenerDelIndice } from '../lib/indice'
import { sincronizar } from '../lib/sincronizacion'

type Modo = 'escanear' | 'buscar'

function aResumen(participante: Participante): ResumenParticipante {
  return {
    participantId: participante.participantId,
    nombre: participante.nombre,
    estadoPago: participante.estadoPago,
    equipoColor: participante.equipoColor,
    checkIn: participante.checkIn
  }
}

async function resolverParticipante(id: string): Promise<ResumenParticipante | undefined> {
  const enIndice = await obtenerDelIndice(id)
  if (enIndice) return enIndice
  if (!navigator.onLine) return undefined
  try {
    const { participante } = await api.obtenerParticipante(id)
    const resumen = aResumen(participante)
    await agregarAlIndice(resumen)
    return resumen
  } catch {
    return undefined
  }
}

function Escaner({ alEscanear }: { alEscanear: (texto: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlesRef = useRef<IScannerControls | null>(null)

  useEffect(() => {
    let activo = true
    const lector = new BrowserQRCodeReader()

    void (async () => {
      try {
        const controles = await lector.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (resultado) => {
            if (!activo || !resultado) return
            alEscanear(resultado.getText())
          }
        )
        if (!activo) {
          controles.stop()
          BrowserQRCodeReader.releaseAllStreams()
          return
        }
        controlesRef.current = controles
      } catch {
        // sin permiso o sin cámara: se muestra la vista sin video
      }
    })()

    return () => {
      activo = false
      controlesRef.current?.stop()
      BrowserQRCodeReader.releaseAllStreams()
    }
  }, [alEscanear])

  return (
    <video
      ref={videoRef}
      className="aspect-video w-full rounded-2xl bg-slate-900 object-cover"
    />
  )
}

export function VistaCheckin() {
  const [modo, setModo] = useState<Modo>('escanear')
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ResumenParticipante[]>([])
  const [participante, setParticipante] = useState<ResumenParticipante | undefined>(undefined)
  const [desconocido, setDesconocido] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const procesar = useCallback(async (texto: string) => {
    const id = texto.trim()
    setParticipante(undefined)
    setDesconocido(false)
    setMensaje(null)
    if (!id) return
    const encontrado = await resolverParticipante(id)
    if (encontrado) {
      setParticipante(encontrado)
    } else {
      setDesconocido(true)
    }
  }, [])

  const alEscanear = useCallback(
    (texto: string) => void procesar(texto),
    [procesar]
  )

  const buscar = useCallback(async () => {
    if (!busqueda.trim()) {
      setResultados([])
      return
    }
    const coincidencias = await buscarEnIndice(busqueda)
    setResultados(coincidencias.slice(0, 20))
  }, [busqueda])

  const registrarLlegada = useCallback(async (resumen: ResumenParticipante) => {
    setProcesando(true)
    setMensaje(null)
    try {
      await encolarOperacion('checkin', { participantId: resumen.participantId })
      await agregarAlIndice({ ...resumen, checkIn: true })
      setParticipante({ ...resumen, checkIn: true })
      if (navigator.onLine) {
        await sincronizar()
      }
      setMensaje('Llegada registrada. ¡Bienvenido/a!')
    } finally {
      setProcesando(false)
    }
  }, [])

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col gap-4">
      <EncabezadoVista
        titulo="Check-in"
        descripcion="Escanea el gafete o busca por nombre"
        acciones={
          <div className="flex gap-2 no-print">
            <Boton
              variante={modo === 'escanear' ? 'principal' : 'secundario'}
              onClick={() => setModo('escanear')}
            >
              Escanear
            </Boton>
            <Boton
              variante={modo === 'buscar' ? 'principal' : 'secundario'}
              onClick={() => setModo('buscar')}
            >
              Buscar
            </Boton>
          </div>
        }
      />

      {modo === 'escanear' ? (
        <Escaner alEscanear={alEscanear} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Campo
                etiqueta="Nombre"
                placeholder="Buscar participante…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void buscar()
                }}
              />
            </div>
            <div className="flex items-end">
              <Boton onClick={() => void buscar()}>Buscar</Boton>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {resultados.map((resultado) => (
              <li key={resultado.participantId}>
                <button
                  type="button"
                  onClick={() => setParticipante(resultado)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:bg-slate-50"
                >
                  <span className="block font-semibold text-slate-900">{resultado.nombre}</span>
                  <span className="mt-1 flex gap-2">
                    <PillPago estadoPago={resultado.estadoPago} />
                    <PillCheckIn checkIn={resultado.checkIn} />
                  </span>
                </button>
              </li>
            ))}
            {busqueda.trim() && resultados.length === 0 ? (
              <li>
                <Alerta tipo="info">Sin coincidencias en los datos locales</Alerta>
              </li>
            ) : null}
          </ul>
        </div>
      )}

      {desconocido ? (
        <Alerta tipo="error">
          El código no corresponde a un participante (o no hay datos locales disponibles sin
          conexión).
        </Alerta>
      ) : null}

      {participante ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print-area">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-slate-900">{participante.nombre}</p>
              <p className="text-xs text-slate-500">{participante.participantId}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <PillPago estadoPago={participante.estadoPago} />
              <PillCheckIn checkIn={participante.checkIn} />
            </div>
          </div>
          {participante.estadoPago !== 'pagado' ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
              {participante.estadoPago === 'pendiente'
                ? 'Pago pendiente: se entrega banda sin bloquear.'
                : 'Pago rechazado: se entrega banda sin bloquear.'}
            </p>
          ) : null}
          {!participante.checkIn ? (
            <Boton
              anchoCompleto
              variante="exito"
              className="mt-3 min-h-14 text-base"
              onClick={() => void registrarLlegada(participante)}
              disabled={procesando}
            >
              {procesando ? 'Registrando…' : 'Registrar llegada'}
            </Boton>
          ) : (
            <p className="mt-3 text-center text-sm font-medium text-emerald-700">
              ✓ Ya llegó
            </p>
          )}
        </div>
      ) : null}

      {mensaje ? <Alerta tipo="exito">{mensaje}</Alerta> : null}
    </div>
  )
}