import type { Participante, RegistrarParticipanteOutput } from '@convencion/shared-types'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

import { Alerta, Boton, Campo, EncabezadoVista, Seleccion } from '../componentes/ui'
import { api } from '../lib/api'
import { encolarOperacion } from '../lib/cola'
import { agregarAlIndice } from '../lib/indice'
import { sincronizar } from '../lib/sincronizacion'

const PATRON_TELEFONO = /^\d{4}-\d{4}$/
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function validarContacto(valor: string): boolean {
  return valor.includes('@') ? PATRON_CORREO.test(valor) : PATRON_TELEFONO.test(valor)
}

function contieneNumeros(valor: string): boolean {
  return /\d/.test(valor)
}

interface DatosFormulario {
  nombre: string
  contacto: string
  correo: string
  localidad: string
  region: string
  edad: string
  diasAsistencia: string[]
  rol: 'joven' | 'encargado' | 'nexo'
  esRegistroPorEncargado: boolean
  encargadoNombre: string
  encargadoContacto: string
}

const INICIO: DatosFormulario = {
  nombre: '',
  contacto: '',
  correo: '',
  localidad: '',
  region: '',
  edad: '',
  diasAsistencia: [],
  rol: 'joven',
  esRegistroPorEncargado: false,
  encargadoNombre: '',
  encargadoContacto: ''
}

function validar(datos: DatosFormulario): string | null {
  if (!datos.nombre.trim()) return 'El nombre es obligatorio'
  if (contieneNumeros(datos.nombre)) return 'El nombre no puede contener números'
  if (datos.nombre.trim().split(/\s+/).length < 2) return 'El nombre debe incluir nombre y apellido'
  // Contacto ahora es opcional
  if (datos.contacto.trim() && !validarContacto(datos.contacto.trim())) return 'El contacto debe ser un teléfono 8877-9955 o un correo válido'
  if (datos.correo.trim() && !PATRON_CORREO.test(datos.correo.trim())) return 'El correo es inválido'
  if (!datos.localidad.trim()) return 'La localidad es obligatoria'
  if (!datos.region) return 'Seleccioná una región válida'
  if (!REGIONES.some(([r]) => r === datos.region)) return 'Seleccioná una región válida'
  if (!datos.edad.trim()) return 'La edad es obligatoria'
  const edadNum = parseInt(datos.edad, 10)
  if (isNaN(edadNum) || edadNum < 1) return 'La edad debe ser un número positivo'
  if (!datos.diasAsistencia || datos.diasAsistencia.length === 0) return 'Seleccioná al menos un día de asistencia'
  if (!datos.diasAsistencia.every((d) => DIAS_ASISTENCIA.some(([dia]) => dia === d))) return 'Día de asistencia inválido'
  if (!datos.rol) return 'Seleccioná un rol válido'
  if (!ROLES.some(([r]) => r === datos.rol)) return 'Seleccioná un rol válido'
  if (
    datos.esRegistroPorEncargado &&
    (!datos.encargadoNombre.trim() || !datos.encargadoContacto.trim())
  ) {
    return 'Los datos del encargado son obligatorios'
  }
  if (datos.encargadoNombre.trim() && contieneNumeros(datos.encargadoNombre)) {
    return 'El nombre del encargado no puede contener números'
  }
  return null
}

export function VistaRegistroInsitu() {
  const [datos, setDatos] = useState<DatosFormulario>(INICIO)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<RegistrarParticipanteOutput | null>(null)
  const [pendiente, setPendiente] = useState(false)

  const actualizar = <K extends keyof DatosFormulario>(campo: K, valor: DatosFormulario[K]) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
  }

  const enviar = async () => {
    setError(null)
    const problema = validar(datos)
    if (problema) {
      setError(problema)
      return
    }
    setProcesando(true)
    try {
      const participantId = crypto.randomUUID()
      const payload = {
        participantId,
        nombre: datos.nombre.trim(),
        contacto: datos.contacto.trim() || undefined,
        correo: datos.correo.trim() || undefined,
        localidad: datos.localidad.trim(),
        region: datos.region,
        edad: parseInt(datos.edad, 10),
        diasAsistencia: datos.diasAsistencia,
        rol: datos.rol,
        esRegistroPorEncargado: datos.esRegistroPorEncargado,
        encargadoNombre: datos.encargadoNombre.trim() || undefined,
        encargadoContacto: datos.encargadoContacto.trim() || undefined,
        tipoRegistro: 'in_situ' as const
      }
      await encolarOperacion('registro_insitu', payload)
      await agregarAlIndice({
        participantId,
        nombre: payload.nombre,
        estadoPago: 'pagado',
        checkIn: false
      })
      const sinConectar = !navigator.onLine
      if (!sinConectar) {
        await sincronizar()
      }
      setPendiente(sinConectar)
      const participante: Participante = {
        participantId,
        nombre: payload.nombre,
        contacto: payload.contacto,
        correo: payload.correo,
        localidad: payload.localidad,
        region: payload.region,
        edad: payload.edad,
        diasAsistencia: payload.diasAsistencia,
        rol: payload.rol,
        esRegistroPorEncargado: payload.esRegistroPorEncargado,
        encargadoNombre: payload.encargadoNombre,
        encargadoContacto: payload.encargadoContacto,
        tipoRegistro: 'in_situ',
        estadoPago: 'pagado',
        checkIn: false,
        fechaRegistro: new Date().toISOString()
      }
      setResultado({ participante, codigoQr: participantId })
      setDatos(INICIO)
    } finally {
      setProcesando(false)
    }
  }

  if (resultado) {
    return (
      <div className="mx-auto w-full max-w-md">
        <EncabezadoVista titulo="Registro in situ" descripcion="Participante creado" />
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print-area">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">{resultado.participante.nombre}</p>
            <p className="text-sm text-slate-500">Registro confirmado · pago pagado</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <QRCodeSVG value={resultado.codigoQr} size={220} level="M" />
          </div>
          {pendiente ? (
            <Alerta tipo="aviso">
              Sin conexión: el registro quedó en cola local y se sincronizará al volver la señal.
            </Alerta>
          ) : (
            <Alerta tipo="exito">Registro sincronizado con el servidor.</Alerta>
          )}
          <Boton
            variante="secundario"
            anchoCompleto
            onClick={() => {
              setResultado(null)
              setPendiente(false)
            }}
          >
            Nuevo registro
          </Boton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <EncabezadoVista
        titulo="Registro in situ"
        descripcion="Crea el participante al momento y genera su gafete"
      />
      <form
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault()
          void enviar()
        }}
      >
        <Campo etiqueta="Nombre completo" value={datos.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
        <Campo etiqueta="Contacto (teléfono 8877-1122 o correo)" value={datos.contacto} onChange={(e) => actualizar('contacto', e.target.value)} />
        <Campo etiqueta="Correo (opcional)" value={datos.correo} onChange={(e) => actualizar('correo', e.target.value)} />
        <Campo etiqueta="Localidad" value={datos.localidad} onChange={(e) => actualizar('localidad', e.target.value)} />
        <Seleccion
          etiqueta="Región"
          value={datos.region}
          onChange={(e) => actualizar('region', e.target.value)}
        >
          <option value="">Seleccioná una región</option>
          {REGIONES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Seleccion>
        <Campo etiqueta="Edad" value={datos.edad} onChange={(e) => actualizar('edad', e.target.value)} type="number" min="1" />
        <fieldset className="border rounded-lg p-4">
          <legend className="mb-3 block text-sm font-medium text-slate-700">Días de asistencia *</legend>
          <div className="flex flex-wrap gap-4">
            {DIAS_ASISTENCIA.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={datos.diasAsistencia.includes(value)}
                  onChange={(e) => {
                    const nuevos = e.target.checked
                      ? [...datos.diasAsistencia, value]
                      : datos.diasAsistencia.filter((d) => d !== value)
                    actualizar('diasAsistencia', nuevos)
                  }}
                  className="size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-900">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Seleccion
          etiqueta="Rol"
          value={datos.rol}
          onChange={(e) => actualizar('rol', e.target.value as 'joven' | 'encargado' | 'nexo')}
        >
          <option value="">Seleccioná un rol</option>
          {ROLES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Seleccion>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={datos.esRegistroPorEncargado}
            onChange={(e) => actualizar('esRegistroPorEncargado', e.target.checked)}
            className="size-5"
          />
          Registro por encargado
        </label>

        {datos.esRegistroPorEncargado ? (
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Campo etiqueta="Nombre del encargado" value={datos.encargadoNombre} onChange={(e) => actualizar('encargadoNombre', e.target.value)} />
            <Campo etiqueta="Contacto del encargado" value={datos.encargadoContacto} onChange={(e) => actualizar('encargadoContacto', e.target.value)} />
          </div>
        ) : null}

        {error ? <Alerta tipo="error">{error}</Alerta> : null}

        <Boton anchoCompleto className="min-h-14 text-base" disabled={procesando}>
          {procesando ? 'Creando…' : 'Crear registro y gafete'}
        </Boton>
      </form>
    </div>
  )
}