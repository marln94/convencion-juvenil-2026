import type { Participante, RegistrarParticipanteOutput } from '@convencion/shared-types'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

import { Alert, Button, Card, DayPicker, Input, Select, VistaHeader } from '@convencion/ui/components/ui'
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

const DIAS_ASISTENCIA_OPTIONS = [
  { value: 'jueves-24', label: 'Jueves 24 de diciembre', number: 24, dayName: 'Jueves', dateTime: '2026-12-24' },
  { value: 'viernes-25', label: 'Viernes 25 de diciembre', number: 25, dayName: 'Viernes', dateTime: '2026-12-25' },
  { value: 'sabado-26', label: 'Sábado 26 de diciembre', number: 26, dayName: 'Sábado', dateTime: '2026-12-26' },
  { value: 'domingo-27', label: 'Domingo 27 de diciembre', number: 27, dayName: 'Domingo', dateTime: '2026-12-27' },
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
  encargadoContacto: '',
}

function validar(datos: DatosFormulario): string | null {
  if (!datos.nombre.trim()) return 'El nombre es obligatorio'
  if (contieneNumeros(datos.nombre)) return 'El nombre no puede contener números'
  if (datos.nombre.trim().split(/\s+/).length < 2) return 'El nombre debe incluir nombre y apellido'
  if (datos.contacto.trim() && !validarContacto(datos.contacto.trim())) return 'El contacto debe ser un teléfono 8877-9955 o un correo válido'
  if (datos.correo.trim() && !PATRON_CORREO.test(datos.correo.trim())) return 'El correo es inválido'
  if (!datos.localidad.trim()) return 'La localidad es obligatoria'
  if (!datos.region) return 'Seleccioná una región válida'
  if (!REGIONES.some(([r]) => r === datos.region)) return 'Seleccioná una región válida'
  if (!datos.edad.trim()) return 'La edad es obligatoria'
  const edadNum = parseInt(datos.edad, 10)
  if (isNaN(edadNum) || edadNum < 1) return 'La edad debe ser un número positivo'
  if (!datos.diasAsistencia || datos.diasAsistencia.length === 0) return 'Seleccioná al menos un día de asistencia'
  if (!datos.diasAsistencia.every((d) => DIAS_ASISTENCIA_OPTIONS.some((dia) => dia.value === d))) return 'Día de asistencia inválido'
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
        tipoRegistro: 'in_situ' as const,
      }
      await encolarOperacion('registro_insitu', payload)
      await agregarAlIndice({
        participantId,
        nombre: payload.nombre,
        estadoPago: 'pagado',
        checkIn: false,
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
        fechaRegistro: new Date().toISOString(),
      }
      setResultado({ participante, codigoQr: participantId })
      setDatos(INICIO)
    } finally {
      setProcesando(false)
    }
  }

  if (resultado) {
    return (
      <div className="container max-w-md">
        <VistaHeader titulo="Registro" descripcion="Participante creado" />
        <Card className="flex flex-col items-center gap-4 print-area text-center">
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{resultado.participante.nombre}</p>
            <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>Registro confirmado · pago pagado</p>
          </div>
          <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
            <QRCodeSVG value={resultado.codigoQr} size={220} level="M" />
          </div>
          {pendiente ? (
            <Alert variant="warning">
              Sin conexión: el registro quedó en cola local y se sincronizará al volver la señal.
            </Alert>
          ) : (
            <Alert variant="success">Registro sincronizado con el servidor.</Alert>
          )}
          <Button variant="outline" fullWidth onClick={() => { setResultado(null); setPendiente(false) }}>
            Nuevo registro
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md">
      <VistaHeader
        titulo="Registro"
        descripcion="Crea el participante al momento y genera su gafete"
      />
      <Card>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void enviar()
          }}
        >
          <Input label="Nombre completo" value={datos.nombre} onChange={(v) => actualizar('nombre', v)} required />
          <Input label="Contacto (teléfono 8877-1122 o correo)" value={datos.contacto} onChange={(v) => actualizar('contacto', v)} />
          <Input label="Correo (opcional)" value={datos.correo} onChange={(v) => actualizar('correo', v)} />
          <Input label="Localidad" value={datos.localidad} onChange={(v) => actualizar('localidad', v)} required />
          <Select
            label="Región"
            value={datos.region}
            onChange={(v) => actualizar('region', v)}
            options={REGIONES}
            required
          />
          <Input label="Edad" value={datos.edad} onChange={(v) => actualizar('edad', v)} type="number" min="1" required />
          <DayPicker
            label="Días de asistencia"
            days={DIAS_ASISTENCIA_OPTIONS}
            value={datos.diasAsistencia}
            onChange={(val) => actualizar('diasAsistencia', val)}
            required
          />
          <Select
            label="Rol"
            value={datos.rol}
            onChange={(v) => actualizar('rol', v as 'joven' | 'encargado' | 'nexo')}
            options={ROLES}
            required
          />

          <label className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.03em', color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={datos.esRegistroPorEncargado}
              onChange={(e) => actualizar('esRegistroPorEncargado', e.target.checked)}
              style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-accent)', border: '2px solid var(--color-ink)', borderRadius: 'var(--radius)', cursor: 'pointer' }}
            />
            Registro por encargado
          </label>

          {datos.esRegistroPorEncargado ? (
            <Card className="p-3" style={{ background: 'var(--color-paper-light)', border: '2px solid var(--color-ink)' }}>
              <Input label="Nombre del encargado" value={datos.encargadoNombre} onChange={(v) => actualizar('encargadoNombre', v)} />
              <Input label="Contacto del encargado" value={datos.encargadoContacto} onChange={(v) => actualizar('encargadoContacto', v)} />
            </Card>
          ) : null}

          {error && <Alert variant="error">{error}</Alert>}

          <Button fullWidth className="min-h-14 text-base" disabled={procesando}>
            {procesando ? 'Creando…' : 'Crear registro y gafete'}
          </Button>
        </form>
      </Card>
    </div>
  )
}