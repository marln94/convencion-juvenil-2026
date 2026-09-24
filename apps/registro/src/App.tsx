import type { FormEvent } from 'react'
import { useCallback, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { ApiError } from '@convencion/api-client'
import type { RegistrarParticipanteOutput } from '@convencion/shared-types'

import { api } from './lib/api'
import { esTipoComprobantePermitido, subirComprobante } from './lib/comprobante'
import { canvasAFile, componerGafete, descargarCanvas, slugDeNombre } from './lib/gafete'

const NOMBRE_CONVENCION = 'Convención Juvenil 2026'

type Paso = 'inicio' | 'datos' | 'comprobante' | 'confirmacion'

interface DatosFormulario {
  nombre: string
  contacto: string
  correo: string
  encargadoNombre: string
  encargadoContacto: string
}

const DATOS_INICIALES: DatosFormulario = {
  nombre: '',
  contacto: '',
  correo: '',
  encargadoNombre: '',
  encargadoContacto: ''
}

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CAMPOS_FORMULARIO: (keyof DatosFormulario)[] = [
  'nombre',
  'contacto',
  'correo',
  'encargadoNombre',
  'encargadoContacto'
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
  error
}: {
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  onBlur?: () => void
  requerido?: boolean
  tipo?: string
  placeholder?: string
  error?: string
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

function Boton({
  children,
  onClick,
  tipo = 'button',
  deshabilitado = false,
  principal = false
}: {
  children: React.ReactNode
  onClick?: () => void
  tipo?: 'button' | 'submit'
  deshabilitado?: boolean
  principal?: boolean
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
          : 'border border-slate-300 text-slate-700 hover:bg-slate-50')
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

export function App() {
  const [paso, setPaso] = useState<Paso>('inicio')
  const [esEncargado, setEsEncargado] = useState(false)

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

  const iniciar = (comoEncargado: boolean) => {
    setEsEncargado(comoEncargado)
    setPaso('datos')
  }

  const tocar = (campo: keyof DatosFormulario) => {
    setTocados((actuales) => (actuales[campo] ? actuales : { ...actuales, [campo]: true }))
  }

  const resetErrores = () => {
    setTocados({})
  }

  const validarCampo = useCallback(
    (campo: keyof DatosFormulario): string | undefined => {
      const valor = datos[campo].trim()
      switch (campo) {
        case 'nombre':
          if (!valor) {
            return 'El nombre es obligatorio'
          }
          if (/\d/.test(valor)) {
            return 'El nombre no puede contener números'
          }
          if (valor.split(/\s+/).length < 2) {
            return 'El nombre debe incluir nombre y apellido'
          }
          return undefined
        case 'contacto':
          if (!valor) {
            return 'El contacto es obligatorio'
          }
          if (valor.includes('@') ? !PATRON_CORREO.test(valor) : !/^\d{4}-\d{4}$/.test(valor)) {
            return 'El contacto debe ser un teléfono 8877-9955 o un correo válido'
          }
          return undefined
        case 'correo':
          if (valor && !PATRON_CORREO.test(valor)) {
            return 'El correo no tiene un formato válido'
          }
          return undefined
        case 'encargadoNombre':
          if (!esEncargado) {
            return undefined
          }
          if (!valor) {
            return 'El nombre del encargado es obligatorio'
          }
          if (/\d/.test(valor)) {
            return 'El nombre del encargado no puede contener números'
          }
          if (valor.split(/\s+/).length < 2) {
            return 'El nombre del encargado debe incluir nombre y apellido'
          }
          return undefined
        case 'encargadoContacto':
          if (!esEncargado) {
            return undefined
          }
          if (!valor) {
            return 'El contacto del encargado es obligatorio'
          }
          if (
            valor.includes('@')
              ? !PATRON_CORREO.test(valor)
              : !/^\d{4}-\d{4}$/.test(valor)
          ) {
            return 'El contacto del encargado debe ser un teléfono 8877-9955 o un correo válido'
          }
          return undefined
      }
    },
    [datos, esEncargado]
  )

  const validarFormulario = useCallback((): ErroresFormulario => {
    const errores: ErroresFormulario = {}
    for (const campo of CAMPOS_FORMULARIO) {
      const error = validarCampo(campo)
      if (error) {
        errores[campo] = error
      }
    }
    return errores
  }, [validarCampo])

  const actualizar = (campo: keyof DatosFormulario) => (valor: string) => {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }))
    tocar(campo)
  }

  const errorDe = (campo: keyof DatosFormulario): string | undefined =>
    tocados[campo] ? validarCampo(campo) : undefined

  const pasarAComprobante = (evento: FormEvent) => {
    evento.preventDefault()
    setTocados(Object.fromEntries(CAMPOS_FORMULARIO.map((campo) => [campo, true])))
    if (Object.keys(validarFormulario()).length === 0) {
      setPaso('comprobante')
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
        contacto: datos.contacto.trim(),
        correo: datos.correo.trim() || undefined,
        esRegistroPorEncargado: esEncargado,
        encargadoNombre: esEncargado ? datos.encargadoNombre.trim() : undefined,
        encargadoContacto: esEncargado ? datos.encargadoContacto.trim() : undefined,
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Inscripción en línea</p>
          <h1 className="text-xl font-bold">{NOMBRE_CONVENCION}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {paso === 'inicio' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">¿Quién se inscribe?</h2>
            <p className="mt-1 text-sm text-slate-500">Elegí cómo querés completar la inscripción.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => iniciar(false)}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-left transition-colors hover:bg-indigo-100"
              >
                <span className="block font-semibold text-indigo-900">Soy el participante</span>
                <span className="block text-sm text-indigo-700">Me inscribo a mí mismo</span>
              </button>
              <button
                type="button"
                onClick={() => iniciar(true)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition-colors hover:bg-slate-100"
              >
                <span className="block font-semibold text-slate-900">Inscribo a otra persona</span>
                <span className="block text-sm text-slate-600">Lo hago como encargado</span>
              </button>
            </div>
          </section>
        )}

        {paso === 'datos' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Datos del formulario</h2>
            <p className="mt-1 text-sm text-slate-500">
              {esEncargado
                ? 'Completá los datos del participante y los del encargado.'
                : 'Completá tus datos de contacto.'}
            </p>

            <form onSubmit={pasarAComprobante} className="mt-5 space-y-4 no-print">
              <Campo etiqueta="Nombre" valor={datos.nombre} onChange={actualizar('nombre')} onBlur={() => tocar('nombre')} requerido placeholder="Nombre y apellido" error={errorDe('nombre')} />
              <Campo etiqueta="Contacto" valor={datos.contacto} onChange={actualizar('contacto')} onBlur={() => tocar('contacto')} requerido placeholder="8877-9955 o correo@gmail.com" error={errorDe('contacto')} />
              <Campo etiqueta="Correo (opcional)" valor={datos.correo} onChange={actualizar('correo')} onBlur={() => tocar('correo')} tipo="email" placeholder="para recibir novedades" error={errorDe('correo')} />
              {esEncargado && (
                <>
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-sm font-medium text-slate-700">Datos del encargado</p>
                  </div>
                  <Campo etiqueta="Nombre del encargado" valor={datos.encargadoNombre} onChange={actualizar('encargadoNombre')} onBlur={() => tocar('encargadoNombre')} requerido error={errorDe('encargadoNombre')} />
                  <Campo etiqueta="Contacto del encargado" valor={datos.encargadoContacto} onChange={actualizar('encargadoContacto')} onBlur={() => tocar('encargadoContacto')} requerido placeholder="8877-9955 o correo@gmail.com" error={errorDe('encargadoContacto')} />
                </>
              )}
              <div className="mt-5 flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Boton onClick={() => { setPaso('inicio'); resetErrores() }}>Volver</Boton>
                <Boton tipo="submit" principal>
                  Continuar
                </Boton>
              </div>
            </form>
          </section>
        )}

        {paso === 'comprobante' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Comprobante de pago</h2>
            <p className="mt-1 text-sm text-slate-500">
              Subí una foto del comprobante de transferencia (PNG/JPG) o el PDF. Ya no vas a
              poder modificarlo después de enviar.
            </p>

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
              <Boton onClick={() => { setPaso('datos'); resetErrores() }}>Volver</Boton>
              <Boton principal onClick={enviarRegistro} deshabilitado={!adjunto || subiendo || enviando}>
                {enviando ? 'Enviando…' : 'Completar inscripción'}
              </Boton>
            </div>
          </section>
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
      </main>

      <footer className="no-print mx-auto max-w-2xl px-4 pb-8 text-center text-xs text-slate-400">
        {NOMBRE_CONVENCION} · Inscripción en línea
      </footer>
    </div>
  )
}