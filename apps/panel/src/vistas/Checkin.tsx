import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import type { Participante, ResumenParticipante } from '@convencion/shared-types'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Alert, Button, Card, Input, Pill, VistaHeader } from '@convencion/ui/components/ui'
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
    checkIn: participante.checkIn,
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
    <Card className="relative aspect-video overflow-hidden" style={{ background: 'var(--color-ink)' }}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
      />
      {pausado && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
          role="status"
          aria-live="polite"
          aria-label="Procesando código QR"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <svg
            className="animate-spin h-10 w-10 text-[var(--color-accent)]"
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
            <p className="mt-2 text-sm" style={{ color: 'var(--color-paper-light)' }}>Tardando más de lo esperado…</p>
          )}
        </div>
      )}
    </Card>
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
    <div className="container max-w-md">
      <VistaHeader
        titulo="Check-in"
        descripcion="Escanea el gafete o busca por nombre"
        acciones={
          <div className="flex gap-2 no-print">
            <Button
              variant={modo === 'escanear' ? 'primary' : 'outline'}
              onClick={() => setModo('escanear')}
            >
              Escanear
            </Button>
            <Button
              variant={modo === 'buscar' ? 'primary' : 'outline'}
              onClick={() => setModo('buscar')}
            >
              Buscar
            </Button>
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
              <Input
                label="Nombre"
                placeholder="Buscar participante…"
                value={busqueda}
                onChange={setBusqueda}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void buscar()
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void buscar()}>Buscar</Button>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {resultados.map((resultado) => (
              <li key={resultado.participantId}>
                <button
                  type="button"
                  onClick={() => setParticipante(resultado)}
                  className="w-full text-left p-3"
                  style={{
                    border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-paper-light)',
                  }}
                >
                  <span className="block font-semibold" style={{ color: 'var(--color-text)' }}>{resultado.nombre}</span>
                  <span className="mt-1 flex gap-2">
                    <Pill variant={resultado.estadoPago === 'pagado' ? 'green' : resultado.estadoPago === 'pendiente' ? 'amber' : 'red'}>
                      {resultado.estadoPago === 'pagado' ? 'Pagado' : resultado.estadoPago === 'pendiente' ? 'Pendiente' : 'Rechazado'}
                    </Pill>
                    <Pill variant={resultado.checkIn ? 'green' : 'default'}>
                      {resultado.checkIn ? 'Llegó' : 'No llegó'}
                    </Pill>
                  </span>
                </button>
              </li>
            ))}
            {busqueda.trim() && resultados.length === 0 && (
              <li>
                <Alert variant="info">Sin coincidencias en los datos locales</Alert>
              </li>
            )}
          </ul>
        </div>
      )}

      {desconocido ? (
        <Alert variant="error">
          El código no corresponde a un participante (o no hay datos locales disponibles sin
          conexión).
        </Alert>
      ) : null}

      {participante ? (
        <Card className="print-area">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{participante.nombre}</p>
              <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>{participante.participantId}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Pill variant={participante.estadoPago === 'pagado' ? 'green' : participante.estadoPago === 'pendiente' ? 'amber' : 'red'}>
                {participante.estadoPago === 'pagado' ? 'Pagado' : participante.estadoPago === 'pendiente' ? 'Pendiente' : 'Rechazado'}
              </Pill>
              <Pill variant={participante.checkIn ? 'green' : 'default'}>
                {participante.checkIn ? 'Llegó' : 'No llegó'}
              </Pill>
            </div>
          </div>
          {participante.estadoPago !== 'pagado' ? (
            <p className="mt-3 text-sm" style={{ background: 'var(--color-paper-light)', padding: '0.5rem', border: '2px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-text)' }}>
              {participante.estadoPago === 'pendiente'
                ? 'Pago pendiente: se entrega banda sin bloquear.'
                : 'Pago rechazado: se entrega banda sin bloquear.'}
            </p>
          ) : null}
          {!participante.checkIn ? (
            <Button
              fullWidth
              variant="primary"
              className="mt-3 min-h-14 text-base"
              onClick={() => void registrarLlegada(participante)}
              disabled={procesando}
            >
              {procesando ? 'Registrando…' : 'Registrar llegada'}
            </Button>
          ) : (
            <p className="mt-3 text-center text-sm font-medium" style={{ color: '#10B981' }}>
              ✓ Ya llegó
            </p>
          )}
        </Card>
      ) : null}

      {mensaje ? <Alert variant="success">{mensaje}</Alert> : null}
    </div>
  )
}