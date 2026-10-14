import type { Participante, RegistrarParticipanteOutput, Rol } from '@convencion/shared-types'
import { EDAD_MAXIMA, EDAD_MINIMA, esCorreo, esTelefono, rangoEdadPermitido } from '@convencion/shared-types'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

import { Alert, Button, Card, DayPicker, EdadField, edadEnRango, Input, Select, TelefonoInput, VistaHeader } from '@convencion/ui/components/ui'
import { api } from '../lib/api'
import { encolarOperacion } from '../lib/cola'
import { decidirEquipoParaLlegada } from '../lib/equipos'
import { EquipoChip } from '../lib/equipo-chip'
import { agregarAlIndice } from '../lib/indice'
import { sincronizar } from '../lib/sincronizacion'
import type { OperacionDescartada } from '../lib/cola'

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
  rol: Rol
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
}

function validar(datos: DatosFormulario): string | null {
  if (!datos.nombre.trim()) return 'El nombre es obligatorio'
  if (contieneNumeros(datos.nombre)) return 'El nombre no puede contener números'
  if (datos.nombre.trim().split(/\s+/).length < 2) return 'El nombre debe incluir nombre y apellido'
  if (datos.contacto.trim() && !esTelefono(datos.contacto.trim())) return 'El contacto debe ser un teléfono 8877-9955'
  if (datos.correo.trim() && !esCorreo(datos.correo.trim())) return 'El correo no tiene un formato válido'
  if (!datos.localidad.trim()) return 'La localidad es obligatoria'
  if (!datos.region) return 'Seleccioná una región válida'
  if (!REGIONES.some(([r]) => r === datos.region)) return 'Seleccioná una región válida'
  if (!datos.edad.trim()) return 'La edad es obligatoria'
  if (!edadEnRango(datos.edad.trim(), rangoEdadPermitido(datos.rol))) return 'Edad no permitida'
  if (!datos.diasAsistencia || datos.diasAsistencia.length === 0) return 'Seleccioná al menos un día de asistencia'
  if (!datos.diasAsistencia.every((d) => DIAS_ASISTENCIA_OPTIONS.some((dia) => dia.value === d))) return 'Día de asistencia inválido'
  if (!datos.rol) return 'Seleccioná un rol válido'
  if (!ROLES.some(([r]) => r === datos.rol)) return 'Seleccioná un rol válido'
  return null
}

export function VistaRegistroInsitu() {
  const [datos, setDatos] = useState<DatosFormulario>(INICIO)
  const [tocado, setTocado] = useState<Record<string, boolean>>({})
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<RegistrarParticipanteOutput | null>(null)
  const [pendiente, setPendiente] = useState(false)
  const [descartadas, setDescartadas] = useState<OperacionDescartada[]>([])

  const actualizar = <K extends keyof DatosFormulario>(campo: K, valor: DatosFormulario[K]) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    setTocado((prev) => ({ ...prev, [campo]: true }))
  }

  const errorDe = (campo: keyof DatosFormulario): string | undefined => {
    if (!tocado[campo]) return undefined
    if (campo === 'nombre') {
      const v = datos.nombre.trim()
      if (!v) return 'El nombre es obligatorio'
      if (contieneNumeros(v)) return 'El nombre no puede contener números'
      if (v.split(/\s+/).length < 2) return 'El nombre debe incluir nombre y apellido'
    }
    if (campo === 'contacto') {
      const v = datos.contacto.trim()
      if (v && !esTelefono(v)) return 'El contacto debe ser un teléfono 8877-9955'
    }
    if (campo === 'correo') {
      const v = datos.correo.trim()
      if (v && !esCorreo(v)) return 'El correo no tiene un formato válido'
    }
    if (campo === 'localidad') {
      const v = datos.localidad.trim()
      if (!v) return 'La localidad es obligatoria'
    }
    if (campo === 'region') {
      if (!datos.region) return 'Seleccioná una región válida'
      if (!REGIONES.some(([r]) => r === datos.region)) return 'Seleccioná una región válida'
    }
    if (campo === 'edad') {
      const v = datos.edad.trim()
      if (!v) return 'La edad es obligatoria'
      if (!edadEnRango(v, rangoEdadPermitido(datos.rol))) return 'Edad no permitida'
    }
    if (campo === 'diasAsistencia') {
      if (!datos.diasAsistencia || datos.diasAsistencia.length === 0) return 'Seleccioná al menos un día de asistencia'
      if (!datos.diasAsistencia.every((d) => DIAS_ASISTENCIA_OPTIONS.some((dia) => dia.value === d))) return 'Día de asistencia inválido'
    }
    if (campo === 'rol') {
      if (!datos.rol) return 'Seleccioná un rol válido'
      if (!ROLES.some(([r]) => r === datos.rol)) return 'Seleccioná un rol válido'
    }
    return undefined
  }

  const enviar = async () => {
    setErrorGlobal(null)
    const problema = validar(datos)
    if (problema) {
      setErrorGlobal(problema)
      return
    }
    setProcesando(true)
    try {
      const participantId = crypto.randomUUID()
      const equipoColor = await decidirEquipoParaLlegada()
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
        tipoRegistro: 'in_situ' as const,
        equipoColor,
      }
      await encolarOperacion('registro_insitu', payload)
      await agregarAlIndice({
        participantId,
        nombre: payload.nombre,
        estadoPago: 'pagado',
        fechaRegistro: new Date().toISOString(),
        equipoColor,
        checkIn: true,
      })
      const sinConectar = !navigator.onLine
      let descartadas: OperacionDescartada[] = []
      if (!sinConectar) {
        descartadas = await sincronizar()
      }
      setDescartadas(descartadas)
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
        esRegistroPorEncargado: false,
        tipoRegistro: 'in_situ',
        estadoPago: 'pagado',
        checkIn: true,
        equipoColor,
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
            <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>Registro confirmado · pago pagado · llegó hoy</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>Equipo:</span>
            <EquipoChip nombre={resultado.participante.equipoColor} size="md" />
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink-soft)' }}>
            <span aria-hidden="true">●</span>
            Banda del color {resultado.participante.equipoColor}. Gafete con código para el check-in.
          </div>
          <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
            <QRCodeSVG value={resultado.codigoQr} size={220} level="M" />
          </div>
          {pendiente ? (
            <Alert variant="warning">
              Sin conexión: el registro quedó en cola local y se sincronizará al volver la señal.
            </Alert>
          ) : (
            (() => {
              const descartada = descartadas.find((d: any) => d.tipo === "registro_insitu" && d.payload.participantId === resultado.participante.participantId)
              if (descartada) {
                return <Alert variant="error">Registro no sincronizado: {descartada.motivo}</Alert>
              }
              return <Alert variant="success">Registro sincronizado con el servidor.</Alert>
            })()
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
          <Input label="Nombre completo" value={datos.nombre} onChange={(v) => actualizar('nombre', v)} onBlur={() => setTocado(t => ({...t,"nombre":true}))} error={errorDe("nombre")} required />
          <TelefonoInput label="Teléfono (opcional)" value={datos.contacto} onChange={(v) => actualizar('contacto', v)} onBlur={() => setTocado(t => ({...t,"contacto":true}))} error={errorDe("contacto")} />
          <Input label="Correo (opcional)" type="email" value={datos.correo} onChange={(v) => actualizar('correo', v)} onBlur={() => setTocado(t => ({...t,"correo":true}))} error={errorDe("correo")} />
          <Input label="Localidad" value={datos.localidad} onChange={(v) => actualizar('localidad', v)} onBlur={() => setTocado(t => ({...t,"localidad":true}))} error={errorDe("localidad")} required />
          <Select
            label="Región"
            value={datos.region}
            onChange={(v) => actualizar('region', v)} onBlur={() => setTocado(t => ({...t,"region":true}))} error={errorDe("region")}
            options={REGIONES}
            required
          />
          <Select
            label="Rol"
            value={datos.rol}
            onChange={(v) => actualizar('rol', v as 'joven' | 'encargado' | 'nexo')}
            options={ROLES}
            required
          />
          <EdadField
            label="Edad"
            value={datos.edad}
            onChange={(v) => actualizar('edad', v)} onBlur={() => setTocado(t => ({...t,"edad":true}))}
            minimo={EDAD_MINIMA}
            maximo={EDAD_MAXIMA}
            rangoPermitido={rangoEdadPermitido(datos.rol)}
            required
          />
          <DayPicker
            label="Días de asistencia"
            days={DIAS_ASISTENCIA_OPTIONS}
            value={datos.diasAsistencia}
            onChange={(val) => actualizar('diasAsistencia', val)}
            required
          />

          {errorGlobal && <Alert variant="error">{errorGlobal}</Alert>}

          <Button fullWidth className="min-h-14 text-base" disabled={procesando}>
            {procesando ? 'Creando…' : 'Crear registro y gafete'}
          </Button>
        </form>
      </Card>
    </div>
  )
}