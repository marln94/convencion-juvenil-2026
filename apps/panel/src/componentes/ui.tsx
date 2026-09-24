import type { EstadoPago } from '@convencion/shared-types'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes
} from 'react'

type VarianteBoton = 'principal' | 'secundario' | 'peligro' | 'exito'

const VARIANTES: Record<VarianteBoton, string> = {
  principal: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300',
  secundario: 'border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  peligro: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300',
  exito: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300'
}

export function Boton({
  variante = 'principal',
  anchoCompleto = false,
  className = '',
  children,
  ...props
}: {
  variante?: VarianteBoton
  anchoCompleto?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${anchoCompleto ? 'w-full' : ''} min-h-11 rounded-lg px-4 py-2 font-medium transition-colors ${VARIANTES[variante]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Campo({
  etiqueta,
  error,
  ...props
}: { etiqueta: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>
      <input
        {...props}
        className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none focus:ring-1 ${error ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'}`}
      />
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
    </label>
  )
}

export function Seleccion({
  etiqueta,
  ...props
}: { etiqueta: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>
      <select
        {...props}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </label>
  )
}

type TipoAlerta = 'error' | 'exito' | 'aviso' | 'info'

const ALERTAS: Record<TipoAlerta, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  exito: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  aviso: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800'
}

export function Alerta({
  tipo,
  children
}: {
  tipo: TipoAlerta
  children: ReactNode
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${ALERTAS[tipo]}`}>
      {children}
    </div>
  )
}

const ESTILO_PAGO: Record<EstadoPago, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  pagado: 'bg-emerald-100 text-emerald-800',
  rechazado: 'bg-red-100 text-red-800'
}

export function PillPago({ estadoPago }: { estadoPago: EstadoPago }) {
  const etiqueta: Record<EstadoPago, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    rechazado: 'Rechazado'
  }
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${ESTILO_PAGO[estadoPago]}`}
    >
      {etiqueta[estadoPago]}
    </span>
  )
}

export function PillCheckIn({ checkIn }: { checkIn: boolean }) {
  return checkIn ? (
    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
      Llegó
    </span>
  ) : (
    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
      No llegó
    </span>
  )
}

export function EncabezadoVista({
  titulo,
  descripcion,
  acciones
}: {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
        {descripcion ? <p className="text-sm text-slate-500">{descripcion}</p> : null}
      </div>
      {acciones}
    </div>
  )
}