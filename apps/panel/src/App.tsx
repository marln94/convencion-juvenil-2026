import type { RolUsuario } from '@convencion/shared-types'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert, Button, Card, Input, Nav, Pill } from '@convencion/ui/components/ui'
import { MarkNeq } from '@convencion/ui/components/decorative'
import { cerrarSesion, iniciarSesion, obtenerSesion, type SesionPanel } from './lib/auth'
import { useEstadoRed } from './lib/sincronizacion'
import { VistaCheckin } from './vistas/Checkin'
import { VistaDashboard } from './vistas/Dashboard'
import { VistaEquipos } from './vistas/Equipos'
import { VistaPagos } from './vistas/Pagos'
import { VistaRegistroInsitu } from './vistas/RegistroInsitu'

type VistaId = 'dashboard' | 'pagos' | 'equipos' | 'checkin' | 'registro-insitu'
type VistaInicial = VistaId | null

const TODAS: VistaId[] = ['dashboard', 'pagos', 'equipos', 'checkin', 'registro-insitu']

const LANDING: Record<RolUsuario, VistaId> = {
  admin: 'dashboard',
  staff: 'checkin'
}

const VISTAS_ADMIN: readonly VistaId[] = TODAS
const VISTAS_STAFF: readonly VistaId[] = ['checkin', 'registro-insitu']

const NAV_ITEMS = [
  { id: 'checkin', label: 'Check-in', adminOnly: false },
  { id: 'registro-insitu', label: 'Registro', adminOnly: false },
  { id: 'dashboard', label: 'Dashboard', adminOnly: true },
  { id: 'pagos', label: 'Pagos', adminOnly: true },
  { id: 'equipos', label: 'Equipos', adminOnly: true },
] as const

function leerVista(): VistaInicial {
  const fragmento = window.location.hash.replace(/^#\/?/, '')
  return (TODAS as string[]).includes(fragmento) ? (fragmento as VistaId) : null
}

function Login({ alIngresar }: { alIngresar: () => void }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    setError(null)
    if (!navigator.onLine) {
      setError('Se requiere conexión para iniciar sesión')
      return
    }
    setEnviando(true)
    try {
      await iniciarSesion(usuario, clave)
      alIngresar()
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4 text-text">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <MarkNeq aria-hidden={true} className="mx-auto mb-4 w-20" />
          <h1 className="t-solid text-3xl">Panel</h1>
          <p className="t-eyebrow mt-2">Convención Juvenil 2026</p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void enviar()
          }}
        >
          <Input
            label="Usuario"
            value={usuario}
            onChange={setUsuario}
            autoComplete="username"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={clave}
            onChange={setClave}
            autoComplete="current-password"
            required
          />
          {error && <Alert variant="error">{error}</Alert>}
          <Button variant="primary" fullWidth disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

function IndicadorConexion() {
  const { enLinea, sincronizando, pendientes } = useEstadoRed()

  if (!enLinea) {
    return <Pill variant="amber">Sin conexión</Pill>
  }
  if (sincronizando) {
    return <Pill variant="default">Sincronizando…</Pill>
  }
  if (pendientes > 0) {
    return <Pill variant="amber">{pendientes} sin sincronizar</Pill>
  }
  return <Pill variant="green">En línea</Pill>
}

function Panel({ sesion }: { sesion: SesionPanel }) {
  const administrador = sesion.rol === 'admin'
  const vistasPermitidas = administrador ? VISTAS_ADMIN : VISTAS_STAFF

  const [vista, setVista] = useState<VistaId>(() => {
    const actual = leerVista()
    return actual !== null && vistasPermitidas.includes(actual)
      ? actual
      : LANDING[sesion.rol]
  })

  const navegar = useCallback((destino: string) => {
    setVista(destino as VistaId)
    window.location.hash = `/${destino}`
  }, [])

  const contenido: Record<VistaId, ReactNode> = useMemo(
    () => ({
      dashboard: <VistaDashboard />,
      pagos: <VistaPagos />,
      equipos: <VistaEquipos />,
      checkin: <VistaCheckin />,
      'registro-insitu': <VistaRegistroInsitu />,
    }),
    []
  )

  const navItems = NAV_ITEMS.filter((item) => administrador || !item.adminOnly).map((item) => ({
    id: item.id,
    label: item.label,
    current: vista === item.id,
  }))

  return (
    <div className="panel-shell flex min-h-dvh flex-col bg-bg text-text">
      <header className="no-print sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MarkNeq size="default" aria-hidden={true} className="text-[var(--color-accent)]" style={{ width: '28px', height: '28px' }} />
            <span className="t-solid text-xl">Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <IndicadorConexion />
            <span className="hidden text-sm sm:inline" style={{ color: 'var(--color-ink-soft)' }}>{sesion.username}</span>
            <Button variant="outline" size="sm" onClick={() => void cerrarSesion()}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="no-print hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] md:block md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:self-start md:overflow-y-auto">
          <Nav orientation="vertical" items={navItems} onNavigate={navegar} className="w-full" />
        </aside>

        <main className="panel-main min-w-0 flex-1">
          <div className="py-6">{contenido[vista]}</div>
        </main>
      </div>

      <Nav
        orientation="horizontal"
        items={navItems}
        onNavigate={navegar}
        className="panel-mobile-nav no-print fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-bg)] md:hidden"
      />
    </div>
  )
}

export function App() {
  const [sesion, setSesion] = useState<SesionPanel | null | 'cargando'>('cargando')

  const cargarSesion = useCallback(async () => {
    const datos = await obtenerSesion()
    if (datos) {
      setSesion(datos)
      navegarInicial(datos.rol)
    } else {
      setSesion(null)
    }
  }, [])

  useEffect(() => {
    void cargarSesion()
  }, [cargarSesion])

  if (sesion === 'cargando') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-text">
        <span style={{ color: 'var(--color-ink-soft)' }}>Cargando…</span>
      </div>
    )
  }

  if (!sesion) {
    return <Login alIngresar={() => void cargarSesion()} />
  }

  return <Panel sesion={sesion} />
}

function navegarInicial(rol: RolUsuario): void {
  const actual = leerVista()
  const permitidas = rol === 'admin' ? VISTAS_ADMIN : VISTAS_STAFF
  if (actual === null || !permitidas.includes(actual)) {
    window.location.hash = `/${LANDING[rol]}`
  }
}