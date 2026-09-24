import type { RolUsuario } from '@convencion/shared-types'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alerta, Boton, Campo } from './componentes/ui'
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

const NAV: { id: VistaId; etiqueta: string; soloAdmin: boolean }[] = [
  { id: 'checkin', etiqueta: 'Check-in', soloAdmin: false },
  { id: 'registro-insitu', etiqueta: 'In situ', soloAdmin: false },
  { id: 'dashboard', etiqueta: 'Dashboard', soloAdmin: true },
  { id: 'pagos', etiqueta: 'Pagos', soloAdmin: true },
  { id: 'equipos', etiqueta: 'Equipos', soloAdmin: true }
]

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
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <form
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault()
          void enviar()
        }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Panel</h1>
        <p className="mb-5 text-sm text-slate-500">Convención Juvenil 2026</p>
        <div className="flex flex-col gap-4">
          <Campo
            etiqueta="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
          />
          <Campo
            etiqueta="Contraseña"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
          />
          {error ? <Alerta tipo="error">{error}</Alerta> : null}
          <Boton anchoCompleto disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Boton>
        </div>
      </form>
    </div>
  )
}

function IndicadorConexion() {
  const { enLinea, sincronizando, pendientes } = useEstadoRed()

  if (!enLinea) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
        Sin conexión
      </span>
    )
  }
  if (sincronizando) {
    return (
      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
        Sincronizando…
      </span>
    )
  }
  if (pendientes > 0) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
        {pendientes} sin sincronizar
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
      En línea
    </span>
  )
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

  const navegar = useCallback((destino: VistaId) => {
    setVista(destino)
    window.location.hash = `/${destino}`
  }, [])

  const contenido: Record<VistaId, ReactNode> = useMemo(
    () => ({
      dashboard: <VistaDashboard />,
      pagos: <VistaPagos />,
      equipos: <VistaEquipos />,
      checkin: <VistaCheckin />,
      'registro-insitu': <VistaRegistroInsitu />
    }),
    []
  )

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <span className="font-bold text-slate-900">Panel</span>
          <div className="flex items-center gap-2">
            <IndicadorConexion />
            <span className="hidden text-sm text-slate-500 sm:inline">{sesion.username}</span>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => void cerrarSesion()}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 md:py-6">
        <div className="mx-auto w-full max-w-5xl">{contenido[vista]}</div>
      </main>

      <nav className="no-print sticky bottom-0 z-10 border-t border-slate-200 bg-white md:static md:border-b md:border-t-0">
        <ul className="mx-auto flex w-full max-w-5xl overflow-x-auto">
          {NAV.filter((item) => administrador || !item.soloAdmin).map((item) => (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => navegar(item.id)}
                className={`w-full min-h-12 px-2 text-sm font-medium transition-colors ${vista === item.id ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {item.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      </nav>
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
      <div className="flex min-h-dvh items-center justify-center bg-slate-100">
        <span className="text-slate-500">Cargando…</span>
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