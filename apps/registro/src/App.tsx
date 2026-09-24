import type { FormEvent } from 'react'
import { Fragment, useCallback, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { ApiError } from '@convencion/api-client'
import type { RegistrarParticipanteOutput } from '@convencion/shared-types'

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

const DIAS_ASISTENCIA: [string, string][] = [
  ['jueves-24', 'Jueves 24 dic'],
  ['viernes-25', 'Viernes 25 dic'],
  ['sabado-26', 'Sábado 26 dic'],
  ['domingo-27', 'Domingo 27 dic'],
]

const ROLES: [string, string][] = [
  ['joven', 'Joven'],
  ['encargado', 'Encargado'],
  ['nexo', 'Nexo'],
]

const CAMPOS_FORMULARIO: (keyof DatosFormulario)[] = [
  'nombre',
  'contacto',
  'correo',
  'localidad',
  'region',
  'edad',
  'diasAsistencia',
  'rol'
]

type CamposTocados = Partial<Record<keyof DatosFormulario, boolean>>
type ErroresFormulario = Partial<Record<keyof DatosFormulario, string>>

function Campo({
  etiqueta,
  valor,
  onChange,
  onBlur,
  requerido = false,
  tipo = 'text',
  placeholder,
  error,
  min
}: {
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  onBlur?: () => void
  requerido?: boolean
  tipo?: string
  placeholder?: string
  error?: string
  min?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">
        {etiqueta}
        {requerido && <span className="text-red-500"> *</span>}
      </span>
<input
              type={tipo}
              value={valor}
              placeholder={placeholder}
              min={min}
              onChange={(evento) => onChange(evento.target.value)}
              onBlur={onBlur}
              aria-invalid={Boolean(error)}
              className={
                'mt-1 w-full min-h-11 rounded-lg border px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-1 ' +
                (error
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500')
              }
            />
      {error && (
        <span role="alert" className="mt-1 block text-sm text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}

function Select({
  etiqueta,
  valor,
  onChange,
  onBlur,
  requerido = false,
  opciones,
  placeholder,
  error
}: {
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  onBlur?: () => void
  requerido?: boolean
  opciones: readonly [string, string][]
  placeholder?: string
  error?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">
        {etiqueta}
        {requerido && <span className="text-red-500"> *</span>}
      </span>
      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={
          'mt-1 w-full min-h-11 rounded-lg border px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-1 ' +
          (error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500')
        }
      >
        <option value="">{placeholder ?? 'Seleccioná una opción'}</option>
        {opciones.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {error && (
        <span role="alert" className="mt-1 block text-sm text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}

function CheckboxGroup({
  etiqueta,
  valores,
  onChange,
  onBlur,
  requerido = false,
  opciones,
  error
}: {
  etiqueta: string
  valores: string[]
  onChange: (valores: string[]) => void
  onBlur?: () => void
  requerido?: boolean
  opciones: readonly [string, string][]
  error?: string
}) {
  const toggle = (valor: string) => {
    const nuevos = valores.includes(valor)
      ? valores.filter((v) => v !== valor)
      : [...valores, valor]
    onChange(nuevos)
  }

  return (
    <fieldset className="border rounded-lg p-4">
      <legend className="text-sm font-medium text-slate-700 mb-3">
        {etiqueta}
        {requerido && <span className="text-red-500"> *</span>}
      </legend>
      <div className="flex flex-wrap gap-4">
        {opciones.map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={valores.includes(value)}
              onChange={() => toggle(value)}
              className="size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-900">{label}</span>
          </label>
        ))}
      </div>
      {error && (
        <span role="alert" className="mt-2 block text-sm text-red-600">
          {error}
        </span>
      )}
    </fieldset>
  )
}

function Boton({
  children,
  onClick,
  tipo = 'button',
  deshabilitado = false,
  principal = false,
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  tipo?: 'button' | 'submit'
  deshabilitado?: boolean
  principal?: boolean
  className?: string
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={deshabilitado}
      className={
        'min-h-11 w-full whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors sm:w-auto ' +
        (principal
          ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-50') + ' ' + className
      }
    >
      {children}
    </button>
  )
}

function Alerta({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {mensaje}
    </div>
  )
}

function IndicadorPasos({ pasoActual }: { pasoActual: Paso }) {
  const idx = PASOS_CONFIG.findIndex((p) => p.id === pasoActual)
  if (idx < 0) return null
  
  const progressPercent = (idx / (PASOS_CONFIG.length - 1)) * 100
  
  return (
    <div className="mb-6 w-full" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={1} aria-valuemax={PASOS_CONFIG.length}>
      <div className="relative flex justify-between items-start w-full">
        <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200" aria-hidden="true">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 rounded" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
        {PASOS_CONFIG.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center relative z-10">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${i <= idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i + 1}
            </div>
            <span className="text-xs font-medium text-slate-500 mt-1 text-center whitespace-nowrap">{p.titulo}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
          if (!v.every((d) => DIAS_ASISTENCIA.some(([dia]) => dia === d))) return 'Día de asistencia inválido'
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
      participantId: resultado.participante.participantId
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
        nombreArchivo: seleccionado.name
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
        comprobante: adjunto
      })
      setResultado(respuesta)
      setPaso('confirmacion')
    } catch (error) {
      setErrorApi(
        error instanceof ApiError ? error.message : 'No se pudo enviar el registro. Intentá nuevamente.'
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Fragment>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <header className="no-print border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-2xl px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Inscripción en línea</p>
            <h1 className="text-xl font-bold">{NOMBRE_CONVENCION}</h1>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
          <Fragment>
            {paso === 'bienvenida' && (
              <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6 text-center">
                <div className="mx-auto max-w-lg">
                  <h2 className="text-xl font-semibold text-slate-900">¡Paz!</h2>
                  <p className="mt-4 text-slate-600 leading-relaxed">
                    Tomaste una gran decisión al iniciar la inscripción, te prometemos que no te arrepentirás. Juntos viviremos unos días especiales en la presencia de Dios.
                  </p>
                  <div className="mt-8">
                    <Boton principal onClick={iniciarWizard} className="w-full sm:w-auto">
                      Comenzar inscripción
                  </Boton>
                </div>
              </div>
            </section>
          )}

          {paso !== 'bienvenida' && paso !== 'confirmacion' && (
            <>
              <IndicadorPasos pasoActual={paso} />

              {PASOS_CONFIG.map((config) => (
                config.id === paso && (
                  <section key={config.id} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-semibold">{config.titulo}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {config.id === 'identidad' && 'Completá tu nombre, rol y edad.'}
                      {config.id === 'ubicacion' && 'Completá tu ubicación.'}
                      {config.id === 'asistencia' && 'Seleccioná los días que asistirás.'}
                      {config.id === 'contacto' && 'Completá tu contacto (opcional).'}
                      {config.id === 'comprobante' && 'Subí el comprobante de pago.'}
                    </p>

                    {config.id !== 'comprobante' && (
                      <form onSubmit={siguientePaso} className="mt-5 space-y-4 no-print">
                        {config.campos.map((campo) => (
                          <Fragment key={campo}>
                            {campo === 'nombre' && (
                              <Campo etiqueta="Nombre" valor={datos.nombre} onChange={actualizar('nombre')} onBlur={() => tocar('nombre')} requerido placeholder="Nombre y apellido" error={errorDe('nombre')} />
                            )}
                            {campo === 'rol' && (
                              <Select etiqueta="Rol" valor={datos.rol} onChange={actualizar('rol')} onBlur={() => tocar('rol')} requerido opciones={ROLES} placeholder="Seleccioná un rol" error={errorDe('rol')} />
                            )}
                            {campo === 'localidad' && (
                              <Campo etiqueta="Localidad" valor={datos.localidad} onChange={actualizar('localidad')} onBlur={() => tocar('localidad')} requerido placeholder="Ubicación de tu iglesia" error={errorDe('localidad')} />
                            )}
                            {campo === 'region' && (
                              <Select etiqueta="Región" valor={datos.region} onChange={actualizar('region')} onBlur={() => tocar('region')} requerido opciones={REGIONES} placeholder="Seleccioná una región" error={errorDe('region')} />
                            )}
                            {campo === 'edad' && (
                              <Campo etiqueta="Edad" valor={datos.edad} onChange={actualizar('edad')} onBlur={() => tocar('edad')} requerido tipo="number" min="1" placeholder="Edad en años" error={errorDe('edad')} />
                            )}
                            {campo === 'diasAsistencia' && (
                              <CheckboxGroup etiqueta="Días de asistencia" valores={datos.diasAsistencia} onChange={actualizar('diasAsistencia')} onBlur={() => tocar('diasAsistencia')} requerido opciones={DIAS_ASISTENCIA} error={errorDe('diasAsistencia')} />
                            )}
                            {campo === 'contacto' && (
                              <Campo etiqueta="Teléfono (opcional)" valor={datos.contacto} onChange={actualizar('contacto')} onBlur={() => tocar('contacto')} placeholder="8877-9955" error={errorDe('contacto')} />
                            )}
                            {campo === 'correo' && (
                              <Campo etiqueta="Correo (opcional)" valor={datos.correo} onChange={actualizar('correo')} onBlur={() => tocar('correo')} tipo="email" placeholder="para recibir novedades" error={errorDe('correo')} />
                            )}
                          </Fragment>
                        ))}
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                          {pasoIndex > 0 && <Boton onClick={pasoAnterior}>Volver</Boton>}
                          <Boton tipo="submit" principal>
                            {esUltimoPasoDatos ? 'Continuar al comprobante' : 'Continuar'}
                          </Boton>
                        </div>
                      </form>
                    )}

                    {config.id === 'comprobante' && (
                      <>
                        {errorApi && <div className="mt-4"><Alerta mensaje={errorApi} /></div>}
                        {errorSubida && <div className="mt-4"><Alerta mensaje={errorSubida} /></div>}
                        {adjunto && !errorApi && !errorSubida && (
                          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            Comprobante subido correctamente: {archivo?.name}
                          </div>
                        )}

                        <div className="mt-5 no-print">
                          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 px-5 py-8 text-center text-slate-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50">
                            <span className="block text-sm font-medium">
                              {subiendo ? 'Subiendo…' : adjunto ? 'Reemplazar comprobante' : 'Seleccionar archivo'}
                            </span>
                            <span className="mt-1 block text-xs">
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
                          <Boton onClick={() => { setPaso('contacto'); resetErrores() }}>Volver</Boton>
                          <Boton principal onClick={enviarRegistro} deshabilitado={!adjunto || subiendo || enviando}>
                            {enviando ? 'Enviando…' : 'Completar inscripción'}
                          </Boton>
                        </div>
                      </>
                    )}
                  </section>
                )
              ))}
            </>
          )}

          {paso === 'confirmacion' && resultado && (
            <section className="print-area rounded-2xl bg-white p-5 text-center shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold">¡Inscripción completada!</h2>
              <p className="mt-1 text-sm text-slate-500">
                Mostrá este código QR en el ingreso a la convención.
              </p>

              <div className="mx-auto mt-6 w-full max-w-[220px] rounded-xl border-2 border-slate-200 p-4">
                <div className="aspect-square w-full">
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={resultado.codigoQr}
                    size={512}
                    level="M"
                    includeMargin
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-500">Tu identificador</p>
                <p className="font-mono text-base font-semibold text-slate-900">{resultado.participante.participantId}</p>
              </div>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Tu comprobante quedó <strong>pendiente de revisión</strong>. Si el pago se
                rechaza, se te va a contactar por el medio indicado.
              </div>

              <div className="mt-6 flex flex-col gap-3 no-print sm:flex-row sm:justify-center">
                <Boton principal onClick={compartirResultado}>
                  {descargado ? 'Gafete descargado' : 'Guardar/Compartir'}
                </Boton>
                <Boton onClick={() => window.location.reload()}>Nueva inscripción</Boton>
              </div>
            </section>
          )}

        </Fragment>
      </main>

      <footer className="no-print mx-auto max-w-2xl px-4 pb-8 text-center text-xs text-slate-400">
        {NOMBRE_CONVENCION} · Inscripción en línea
      </footer>
    </div>
      </Fragment>
  )
}