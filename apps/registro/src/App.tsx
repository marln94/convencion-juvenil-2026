import type { FormEvent } from 'react'
import { Fragment, useCallback, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { ApiError } from '@convencion/api-client'
import type { RegistrarParticipanteOutput } from '@convencion/shared-types'

import { Alert, Button, Card, CheckboxGroup, Input, Select, StepIndicator, VistaHeader, Hero, MarkNeq, Brush, Container, Section, InfoBlock } from '@convencion/ui/components/ui'
import { api } from './lib/api'
import { esTipoComprobantePermitido, subirComprobante } from './lib/comprobante'
import { canvasAFile, componerGafete, descargarCanvas, slugDeNombre } from './lib/gafete'

const NOMBRE_CONVENCION = 'Convención Juvenil 2026'

type Paso = 'bienvenida' | 'identidad' | 'ubicacion' | 'asistencia' | 'contacto' | 'comprobante' | 'confirmacion'

const PASOS_CONFIG = [
  { id: 'identidad', titulo: 'Identidad', campos: ['nombre', 'rol', 'edad'] as const },
  { id: 'ubicacion', titulo: 'Ubicación', campos: ['localidad', 'region'] as const },
  { id: 'asistencia', titulo: 'Días', campos: ['diasAsistencia'] as const },
  { id: 'contacto', titulo: 'Contacto', campos: ['contacto', 'correo'] as const },
  { id: 'comprobante', titulo: 'Pago', campos: [] as const },
] as const

interface DatosFormulario {
  nombre: string
  contacto: string
  correo: string
  localidad: string
  region: string
  edad: string
  diasAsistencia: string[]
  rol: 'joven' | 'encargado' | 'nexo'
}

const DATOS_INICIALES: DatosFormulario = {
  nombre: '',
  contacto: '',
  correo: '',
  localidad: '',
  region: '',
  edad: '',
  diasAsistencia: [],
  rol: 'joven'
}

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PATRON_TELEFONO = /^\d{4}-\d{4}$/

const REGIONES: [string, string][] = [
  ['1', 'Región 1 - Francisco Morazán 1'],
  ['2', 'Región 2 - El Paraíso'],
  ['3', 'Región 3 - Choluteca'],
  ['4', 'Región 4 - Ocotepeque 1'],
  ['5', 'Región 5 - Atlántida'],
  ['6', 'Región 6 - Olancho'],
  ['7', 'Región 7 - Trojes'],
  ['8', 'Región 8 - Danlí 1'],
  ['9', 'Región 9 - Ocotepeque 2'],
  ['10', 'Región 10 - Francisco Morazán 2'],
  ['11', 'Región 11 - Lempira'],
  ['12', 'Región 12 - Cortés'],
  ['13', 'Región 13 - Danlí 2'],
]

const DIAS_ASISTENCIA_OPTIONS = [
  { value: 'jueves-24', label: 'Jueves 24' },
  { value: 'viernes-25', label: 'Viernes 25' },
  { value: 'sabado-26', label: 'Sábado 26' },
  { value: 'domingo-27', label: 'Domingo 27' },
]

const ROLES: [string, string][] = [
  ['joven', 'Joven'],
  ['encargado', 'Encargado'],
  ['nexo', 'Nexo'],
]

type CamposTocados = Partial<Record<keyof DatosFormulario, boolean>>
type ErroresFormulario = Partial<Record<keyof DatosFormulario, string>>

export function App() {
  const [paso, setPaso] = useState<Paso>('bienvenida')

  const [datos, setDatos] = useState<DatosFormulario>(DATOS_INICIALES)
  const [tocados, setTocados] = useState<CamposTocados>({})

  const [archivo, setArchivo] = useState<File | null>(null)
  const [adjunto, setAdjunto] = useState<{ s3Key: string; contentType: string } | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)

  const [errorApi, setErrorApi] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<RegistrarParticipanteOutput | null>(null)
  const [descargado, setDescargado] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const pasoActual = PASOS_CONFIG.find((p) => p.id === paso)
  const pasoIndex = pasoActual ? PASOS_CONFIG.findIndex((p) => p.id === paso) : 0
  const esUltimoPasoDatos = pasoActual?.id === 'contacto'

  const camposPasoActual = pasoActual?.campos ?? []

  const iniciarWizard = () => {
    setPaso('identidad')
  }

  const tocar = (campo: keyof DatosFormulario) => {
    setTocados((actuales) => (actuales[campo] ? actuales : { ...actuales, [campo]: true }))
  }

  const resetErrores = () => {
    setTocados({})
  }

  const validarCampo = useCallback(
    (campo: keyof DatosFormulario): string | undefined => {
      switch (campo) {
        case 'nombre': {
          const v = datos.nombre.trim()
          if (!v) return 'El nombre es obligatorio'
          if (/\d/.test(v)) return 'El nombre no puede contener números'
          if (v.split(/\s+/).length < 2) return 'El nombre debe incluir nombre y apellido'
          return undefined
        }
        case 'contacto': {
          const v = datos.contacto.trim()
          if (v && !PATRON_TELEFONO.test(v)) {
            return 'El contacto debe ser un teléfono 8877-9955'
          }
          return undefined
        }
        case 'correo': {
          const v = datos.correo.trim()
          if (v && !PATRON_CORREO.test(v)) return 'El correo no tiene un formato válido'
          return undefined
        }
        case 'localidad': {
          const v = datos.localidad.trim()
          if (!v) return 'La localidad es obligatoria'
          return undefined
        }
        case 'region': {
          const v = datos.region
          if (!v) return 'Seleccioná una región válida'
          if (!REGIONES.some(([r]) => r === v)) return 'Seleccioná una región válida'
          return undefined
        }
        case 'edad': {
          const v = datos.edad.trim()
          if (!v) return 'La edad es obligatoria'
          const edadNum = parseInt(v, 10)
          if (isNaN(edadNum) || edadNum < 1) return 'La edad debe ser un número positivo'
          return undefined
        }
        case 'diasAsistencia': {
          const v = datos.diasAsistencia
          if (!v || v.length === 0) return 'Seleccioná al menos un día de asistencia'
          if (!v.every((d) => DIAS_ASISTENCIA_OPTIONS.some((dia) => dia.value === d))) return 'Día de asistencia inválido'
          return undefined
        }
        case 'rol': {
          const v = datos.rol
          if (!v) return 'Seleccioná un rol válido'
          if (!ROLES.some(([r]) => r === v)) return 'Seleccioná un rol válido'
          return undefined
        }
      }
    },
    [datos]
  )

  const validarPasoActual = useCallback((): ErroresFormulario => {
    const errores: ErroresFormulario = {}
    for (const campo of camposPasoActual) {
      const error = validarCampo(campo)
      if (error) {
        errores[campo] = error
      }
    }
    return errores
  }, [validarCampo, camposPasoActual])

  const actualizar = (campo: keyof DatosFormulario) => (valor: string | string[]) => {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }))
    tocar(campo)
  }

  const errorDe = (campo: keyof DatosFormulario): string | undefined =>
    tocados[campo] ? validarCampo(campo) : undefined

  const siguientePaso = (evento: FormEvent) => {
    evento.preventDefault()
    if (pasoIndex < 0 || pasoIndex >= PASOS_CONFIG.length) return
    setTocados(Object.fromEntries(camposPasoActual.map((campo) => [campo, true])))
    const errores = validarPasoActual()
    if (Object.keys(errores).length === 0) {
      if (esUltimoPasoDatos) {
        setPaso('comprobante')
      } else if (pasoIndex + 1 < PASOS_CONFIG.length) {
        const nextPaso = PASOS_CONFIG[pasoIndex + 1]
        if (nextPaso) setPaso(nextPaso.id)
      }
    }
  }

  const pasoAnterior = () => {
    if (pasoIndex <= 0 || pasoIndex >= PASOS_CONFIG.length) return
    const prevPaso = PASOS_CONFIG[pasoIndex - 1]
    if (prevPaso) {
      setPaso(prevPaso.id)
      resetErrores()
    }
  }

  const compartirResultado = async () => {
    if (!resultado || !qrCanvasRef.current) {
      return
    }
    const lienzo = await componerGafete(qrCanvasRef.current, {
      nombre: resultado.participante.nombre,
      participantId: resultado.participante.participantId,
    })
    const nombreArchivo = `gafete-${slugDeNombre(resultado.participante.nombre)}.png`
    const archivo = await canvasAFile(lienzo, nombreArchivo)
    if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo] })
      } catch {
        // el usuario canceló el diálogo de compartir; no hacemos nada
      }
      return
    }
    descargarCanvas(lienzo, nombreArchivo)
    setDescargado(true)
    setTimeout(() => setDescargado(false), 2000)
  }

  const seleccionarArchivo = async (evento: FormEvent<HTMLInputElement>) => {
    const seleccionado = evento.currentTarget.files?.[0]
    if (!seleccionado) {
      return
    }

    setErrorSubida(null)
    setErrorApi(null)
    setAdjunto(null)

    const contentType = seleccionado.type || 'application/octet-stream'
    if (!esTipoComprobantePermitido(contentType)) {
      setArchivo(null)
      setErrorSubida('El archivo debe ser una imagen PNG/JPG o un PDF')
      return
    }

    setArchivo(seleccionado)
    setSubiendo(true)
    try {
      const solicitud = await api.solicitarComprobanteUpload({
        contentType,
        nombreArchivo: seleccionado.name,
      })
      await subirComprobante(solicitud, seleccionado)
      setAdjunto({ s3Key: solicitud.s3Key, contentType })
    } catch {
      setArchivo(null)
      setAdjunto(null)
      setErrorSubida('No se pudo subir el comprobante. Intentá nuevamente.')
    } finally {
      setSubiendo(false)
    }
  }

  const enviarRegistro = async () => {
    if (!adjunto) {
      return
    }
    setEnviando(true)
    setErrorApi(null)
    try {
      const respuesta = await api.registrarParticipante({
        nombre: datos.nombre.trim(),
        contacto: datos.contacto.trim() || undefined,
        correo: datos.correo.trim() || undefined,
        localidad: datos.localidad.trim(),
        region: datos.region,
        edad: parseInt(datos.edad, 10),
        diasAsistencia: datos.diasAsistencia,
        rol: datos.rol,
        tipoRegistro: 'online',
        comprobante: adjunto,
      })
      setResultado(respuesta)
      setPaso('confirmacion')
    } catch (error) {
      setErrorApi(
        error instanceof ApiError ? error.message : 'No se pudo enviar el registro. Intentá nuevamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Fragment>
      <div className="min-h-screen paper-noise" style={{ background: 'var(--color-bg)' }}>
        <header className="no-print border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <Container>
            <div className="py-4">
              <p className="t-eyebrow text-sm" style={{ color: 'var(--color-accent)' }}>Inscripción en línea</p>
              <h1 className="t-solid text-2xl">{NOMBRE_CONVENCION}</h1>
            </div>
          </Container>
        </header>

        <main>
          <Container>
            <Fragment>
              {paso === 'bienvenida' && (
                <Hero className="relative py-12">
                  <div className="text-center">
                    <div className="stack animate-stack-stagger mx-auto max-w-3xl mb-8" aria-label="Muy pronto">
                      <span className="t-outline">MUY PRONTO</span>
                      <span className="t-solid">MUY PRONTO</span>
                      <span className="t-outline">MUY PRONTO</span>
                      <span className="t-solid">MUY PRONTO</span>
                    </div>
                    <MarkNeq size="hero" aria-hidden={true} className="animate-neq-enter" />
                    <Brush position="tr" className="animate-brush-fade" />
                    <Brush position="bl" className="animate-brush-fade" />
                  </div>
                  <div className="mt-8">
                    <Button variant="primary" onClick={iniciarWizard} className="w-full sm:w-auto">
                      Comenzar inscripción
                    </Button>
                  </div>
                </Hero>
              )}

              {paso !== 'bienvenida' && paso !== 'confirmacion' && (
                <>
                  <StepIndicator current={pasoIndex + 1} total={PASOS_CONFIG.length} labels={PASOS_CONFIG.map(p => p.titulo)} />

                  {PASOS_CONFIG.map((config) =>
                    config.id === paso && (
                      <Section key={config.id} className="mb-8">
                        <div className="mb-6">
                          <h2 className="t-solid text-2xl">{config.titulo}</h2>
                          <p className="t-eyebrow mt-1">
                            {config.id === 'identidad' && 'Completá tu nombre, rol y edad.'}
                            {config.id === 'ubicacion' && 'Completá tu ubicación.'}
                            {config.id === 'asistencia' && 'Seleccioná los días que asistirás.'}
                            {config.id === 'contacto' && 'Completá tu contacto (opcional).'}
                            {config.id === 'comprobante' && 'Subí el comprobante de pago.'}
                          </p>
                        </div>

                        {config.id !== 'comprobante' && (
                          <form onSubmit={siguientePaso} className="space-y-4 no-print">
                            {config.campos.map((campo) => (
                              <Fragment key={campo}>
                                {campo === 'nombre' && (
                                  <Input
                                    label="Nombre"
                                    value={datos.nombre}
                                    onChange={actualizar('nombre')}
                                    onBlur={() => tocar('nombre')}
                                    required
                                    placeholder="Nombre y apellido"
                                    error={errorDe('nombre')}
                                  />
                                )}
                                {campo === 'rol' && (
                                  <Select
                                    label="Rol"
                                    value={datos.rol}
                                    onChange={actualizar('rol')}
                                    onBlur={() => tocar('rol')}
                                    required
                                    options={ROLES}
                                    placeholder="Seleccioná un rol"
                                    error={errorDe('rol')}
                                  />
                                )}
                                {campo === 'localidad' && (
                                  <Input
                                    label="Localidad"
                                    value={datos.localidad}
                                    onChange={actualizar('localidad')}
                                    onBlur={() => tocar('localidad')}
                                    required
                                    placeholder="Ubicación de tu iglesia"
                                    error={errorDe('localidad')}
                                  />
                                )}
                                {campo === 'region' && (
                                  <Select
                                    label="Región"
                                    value={datos.region}
                                    onChange={actualizar('region')}
                                    onBlur={() => tocar('region')}
                                    required
                                    options={REGIONES}
                                    placeholder="Seleccioná una región"
                                    error={errorDe('region')}
                                  />
                                )}
                                {campo === 'edad' && (
                                  <Input
                                    label="Edad"
                                    value={datos.edad}
                                    onChange={actualizar('edad')}
                                    onBlur={() => tocar('edad')}
                                    required
                                    type="number"
                                    min="1"
                                    placeholder="Edad en años"
                                    error={errorDe('edad')}
                                  />
                                )}
                                {campo === 'diasAsistencia' && (
                                  <CheckboxGroup
                                    label="Días de asistencia"
                                    value={datos.diasAsistencia}
                                    onChange={actualizar('diasAsistencia')}
                                    onBlur={() => tocar('diasAsistencia')}
                                    required
                                    options={DIAS_ASISTENCIA_OPTIONS}
                                    error={errorDe('diasAsistencia')}
                                  />
                                )}
                                {campo === 'contacto' && (
                                  <Input
                                    label="Teléfono (opcional)"
                                    value={datos.contacto}
                                    onChange={actualizar('contacto')}
                                    onBlur={() => tocar('contacto')}
                                    placeholder="8877-9955"
                                    error={errorDe('contacto')}
                                  />
                                )}
                                {campo === 'correo' && (
                                  <Input
                                    label="Correo (opcional)"
                                    value={datos.correo}
                                    onChange={actualizar('correo')}
                                    onBlur={() => tocar('correo')}
                                    type="email"
                                    placeholder="para recibir novedades"
                                    error={errorDe('correo')}
                                  />
                                )}
                              </Fragment>
                            ))}
                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                              {pasoIndex > 0 && <Button variant="outline" onClick={pasoAnterior}>Volver</Button>}
                              <Button type="submit" variant="primary">
                                {esUltimoPasoDatos ? 'Continuar al comprobante' : 'Continuar'}
                              </Button>
                            </div>
                          </form>
                        )}

                        {config.id === 'comprobante' && (
                          <>
                            {errorApi && <div className="mb-4"><Alert variant="error">{errorApi}</Alert></div>}
                            {errorSubida && <div className="mb-4"><Alert variant="error">{errorSubida}</Alert></div>}
                            {adjunto && !errorApi && !errorSubida && (
                              <Alert variant="success" className="mb-4">
                                Comprobante subido correctamente: {archivo?.name}
                              </Alert>
                            )}

                            <div className="mt-5 no-print">
                              <label className="block cursor-pointer" style={{
                                border: '2px dashed var(--color-border)',
                                borderRadius: 'var(--radius)',
                                padding: '2rem',
                                textAlign: 'center',
                                background: 'var(--color-paper)',
                                color: 'var(--color-ink-soft)',
                                transition: 'all 0.2s',
                              }}>
                                <span className="block text-sm font-medium" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                  {subiendo ? 'Subiendo…' : adjunto ? 'Reemplazar comprobante' : 'Seleccionar archivo'}
                                </span>
                                <span className="mt-1 block text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                                  Imagen PNG o JPG, o PDF (máx. 5 MB)
                                </span>
                                <input
                                  type="file"
                                  accept={['image/png', 'image/jpeg', 'application/pdf'].join(',')}
                                  disabled={subiendo}
                                  onChange={seleccionarArchivo}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="mt-6 flex flex-col-reverse gap-3 no-print sm:flex-row sm:justify-end">
                              <Button variant="outline" onClick={() => { setPaso('contacto'); resetErrores() }}>Volver</Button>
                              <Button variant="primary" onClick={enviarRegistro} disabled={!adjunto || subiendo || enviando}>
                                {enviando ? 'Enviando…' : 'Completar inscripción'}
                              </Button>
                            </div>
                          </>
                        )}
                      </Section>
                    )
                  )}
                </>
              )}

              {paso === 'confirmacion' && resultado && (
                <Section className="print-area text-center">
                  <h2 className="t-solid text-xl">¡Inscripción completada!</h2>
                  <p className="t-eyebrow mt-1">Mostrá este código QR en el ingreso a la convención.</p>

                  <div className="mx-auto mt-6 w-full max-w-[90vw] sm:max-w-[320px] md:max-w-[360px]">
                    <Card className="aspect-square flex items-center justify-center">
                      <QRCodeCanvas
                        ref={qrCanvasRef}
                        value={resultado.codigoQr}
                        size={512}
                        level="M"
                        includeMargin
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Card>
                  </div>

                  <Card className="mt-5 text-sm">
                    <p className="t-eyebrow">Tu identificador</p>
                    <p className="font-mono font-semibold" style={{ color: 'var(--color-text)' }}>{resultado.participante.participantId}</p>
                  </Card>

                  <Alert variant="warning" className="mt-4">
                    Tu comprobante quedó <strong>pendiente de revisión</strong>. Si el pago se
                    rechaza, se te va a contactar por el medio indicado.
                  </Alert>

                  <div className="mt-6 flex flex-col gap-3 no-print sm:flex-row sm:justify-center">
                    <Button variant="primary" onClick={compartirResultado}>
                      {descargado ? 'Gafete descargado' : 'Guardar/Compartir'}
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>Nueva inscripción</Button>
                  </div>
                </Section>
              )}

            </Fragment>
          </Container>
        </main>

        <footer className="no-print mt-auto">
          <Container>
            <p className="text-center py-8 text-xs" style={{ color: 'var(--color-ink-soft)' }}>
              {NOMBRE_CONVENCION} · Inscripción en línea
            </p>
          </Container>
        </footer>
      </div>
    </Fragment>
  )
}