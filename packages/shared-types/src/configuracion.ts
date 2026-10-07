export type ConfiguracionId = 'equipos'

export interface ConfiguracionEquipos {
  configId: ConfiguracionId
  /** Equipos activos (nombres). Vacío = usar la lista por defecto del código. */
  colores: string[]
}