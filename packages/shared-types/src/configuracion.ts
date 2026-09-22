export type ConfiguracionId = 'equipos'

export interface ConfiguracionEquipos {
  configId: ConfiguracionId
  bloqueado: boolean
  fechaGeneracion?: string
  colores: string[]
}