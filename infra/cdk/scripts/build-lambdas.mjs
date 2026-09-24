// Genera los bundles Lambda de `services/api` bajo `dist-lambda/<handler>/index.js`.
// El bundling corre con `absWorkingDir` en un dir temporal SIN `.pnp.cjs` en sus
// ancestros, para evitar que esbuild active la resolución Yarn Plug'n'Play de
// proyectos que viven fuera de este monorepo.
import { mkdirSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ_REPO = resolve(AQUI, '../../..')
const API_SRC = join(RAIZ_REPO, 'services', 'api', 'src')
const DESTINO = join(AQUI, '..', 'dist-lambda')

const HANDLERS = [
  { nombre: 'registro', entrada: join(API_SRC, 'handlers', 'registro.ts') },
  { nombre: 'listado', entrada: join(API_SRC, 'handlers', 'listar-participantes.ts') },
  { nombre: 'revisar-pago', entrada: join(API_SRC, 'handlers', 'revisar-pago.ts') },
  { nombre: 'equipos', entrada: join(API_SRC, 'handlers', 'generar-equipos.ts') },
  { nombre: 'checkin', entrada: join(API_SRC, 'checkin-lambda.ts') }
]

const DIR_TRABAJO = join(tmpdir(), 'convencion-cdk-bundle')
mkdirSync(DIR_TRABAJO, { recursive: true })

rmSync(DESTINO, { recursive: true, force: true })

for (const { nombre, entrada } of HANDLERS) {
  const salidaDir = join(DESTINO, nombre)
  mkdirSync(salidaDir, { recursive: true })
  const resultado = await build({
    entryPoints: [entrada],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: join(salidaDir, 'index.js'),
    absWorkingDir: DIR_TRABAJO,
    logLevel: 'info'
  })
  if (resultado.errors.length > 0) {
    console.error(`[build:lambdas] error al empaquetar ${nombre}`)
    process.exit(1)
  }
  console.log(`[build:lambdas] ${nombre} → ${salidaDir}/index.js`)
}

console.log(`[build:lambdas] listo en ${DESTINO}`)