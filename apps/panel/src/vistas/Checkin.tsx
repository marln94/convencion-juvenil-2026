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

interface EscanerProps {
  alEscanear: (texto: string) => void
  pausado: boolean
  showHint?: boolean
  cooldownMs?: number
}

function Escaner({ alEscanear, pausado, showHint, cooldownMs = 500 }: EscanerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlesRef = useRef<IScannerControls | null>(null)
  const [cooldown, setCooldown] = useState(false)

  useEffect(() => {
    let activo = true
    const lector = new BrowserQRCodeReader()
    let cooldownTimer: ReturnType<typeof setTimeout>

    const iniciarEscaner = async () => {
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
    }

    const detenerEscaner = () => {
      controlesRef.current?.stop()
      BrowserQRCodeReader.releaseAllStreams()
      controlesRef.current = null
    }

    if (!pausado && !cooldown) {
      void iniciarEscaner()
    } else {
      detenerEscaner()

      if (!pausado && cooldown) {
        cooldownTimer = setTimeout(() => setCooldown(false), cooldownMs)
      }
    }

    if (pausado) {
      setCooldown(true)
    }

    return () => {
      activo = false
      clearTimeout(cooldownTimer)
      detenerEscaner()
    }
  }, [alEscanear, pausado, cooldown, cooldownMs])

  return (
    <div className="relative aspect-video w-full rounded-2xl bg-slate-900 overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
      />
      {pausado && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl"
          role="status"
          aria-live="polite"
          aria-label="Procesando código QR"
        >
          <svg
            className="animate-spin h-10 w-10 text-indigo-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {showHint && (
            <p className="mt-2 text-sm text-white/80">Tardando más de lo esperado…</p>
          )}
        </div>
      )}
    </div>
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
  const [isResolving, setIsResolving] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (modo === 'buscar') {
      setParticipante(undefined)
      setDesconocido(false)
      setMensaje(null)
    }
  }, [modo])

  const procesar = useCallback(async (texto: string) => {
    const id = texto.trim()
    setParticipante(undefined)
    setDesconocido(false)
    setMensaje(null)
    if (!id) return

    const SHOW_LOADER_DELAY = 200
    const MIN_LOADER_TIME = 300

    let loaderShown = false
    const hintTimer = setTimeout(() => setShowHint(true), 5000)

    const showLoaderTimer = setTimeout(() => {
      loaderShown = true
      setIsResolving(true)
      setShowHint(false)
    }, SHOW_LOADER_DELAY)

    try {
      const encontrado = await resolverParticipante(id)
      if (encontrado) {
        setParticipante(encontrado)
      } else {
        setDesconocido(true)
      }
    } finally {
      clearTimeout(hintTimer)
      clearTimeout(showLoaderTimer)

      if (loaderShown) {
        setTimeout(() => {
          setIsResolving(false)
          setShowHint(false)
        }, MIN_LOADER_TIME)
      } else {
        setIsResolving(false)
        setShowHint(false)
      }
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
        <Escaner
          alEscanear={alEscanear}
          pausado={isResolving}
          showHint={showHint}
          cooldownMs={500}
        />
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