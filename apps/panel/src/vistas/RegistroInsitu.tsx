import type { Participante, RegistrarParticipanteOutput } from '@convencion/shared-types'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

import { Alerta, Boton, Campo, EncabezadoVista } from '../componentes/ui'
import { api } from '../lib/api'
import { encolarOperacion } from '../lib/cola'
import { agregarAlIndice } from '../lib/indice'
import { sincronizar } from '../lib/sincronizacion'

const PATRON_TELEFONO = /^\d{4}-\d{4}$/
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  esRegistroPorEncargado: boolean
  encargadoNombre: string
  encargadoContacto: string
}

const INICIO: DatosFormulario = {
  nombre: '',
  contacto: '',
  correo: '',
  esRegistroPorEncargado: false,
  encargadoNombre: '',
  encargadoContacto: ''
}

function validar(datos: DatosFormulario): string | null {
  if (!datos.nombre.trim()) return 'El nombre es obligatorio'
  if (contieneNumeros(datos.nombre)) return 'El nombre no puede contener números'
  if (datos.nombre.trim().split(/\s+/).length < 2) return 'El nombre debe incluir nombre y apellido'
  if (!datos.contacto.trim()) return 'El contacto es obligatorio'
  if (!validarContacto(datos.contacto.trim())) return 'El contacto debe ser un teléfono 8877-9955 o un correo válido'
  if (datos.correo.trim() && !PATRON_CORREO.test(datos.correo.trim())) return 'El correo es inválido'
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
        contacto: datos.contacto.trim(),
        correo: datos.correo.trim() || undefined,
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