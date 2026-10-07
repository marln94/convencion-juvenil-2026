import { hexPorNombre, textoSobreColor } from './equipos'

export function EquipoChip({ nombre, size = 'sm' }: { nombre?: string; size?: 'sm' | 'md' }) {
  const hex = nombre ? hexPorNombre(nombre) : undefined
  const texto = hex ? textoSobreColor(hex) : undefined
  const altura = size === 'md' ? '0.65rem 1.1rem' : '0.25rem 0.75rem'

  if (!hex) {
    return (
      <span
        className="inline-flex items-center gap-1.5 whitespace-nowrap"
        style={{ padding: altura, border: '1.5px solid var(--color-border)', borderRadius: '999px', color: 'var(--color-ink-soft)', fontSize: size === 'md' ? '0.9rem' : '0.75rem', fontWeight: 600 }}
      >
        <span aria-hidden="true">○</span>
        {nombre ?? 'Sin equipo'}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{
        padding: altura,
        background: hex,
        color: texto,
        borderRadius: '999px',
        fontSize: size === 'md' ? '0.9rem' : '0.75rem',
        fontWeight: 700,
        border: hex === '#FFFFFF' ? '1.5px solid var(--color-border)' : '1.5px solid rgba(0,0,0,0.08)'
      }}
    >
      <span aria-hidden="true">●</span>
      {nombre}
    </span>
  )
}