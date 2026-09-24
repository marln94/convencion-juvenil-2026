import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DIR_CDK = resolve(AQUI, '..')
const RAIZ_REPO = resolve(DIR_CDK, '../..')

const PIEDRA = 'public,max-age=31536000,immutable'
const NUEVA = 'no-cache, no-store, must-revalidate'

const ejecutar = (cmd, args, opts = {}) => {
  console.log(`[deploy-apps] ${cmd} ${args.join(' ')}`)
  execFileSync(cmd, args, { stdio: 'inherit', ...opts })
}

const archivoSalidas = join(DIR_CDK, 'cdk-outputs.json')
const salidas = JSON.parse(readFileSync(archivoSalidas, 'utf8'))

const stacks = Object.values(salidas).reduce((acu, outs) => ({ ...acu, ...outs }), {})
const requerido = ['UrlApi', 'UserPoolId', 'UserPoolClientId', 'BucketRegistro', 'BucketPanel', 'DistRegistroId', 'DistPanelId']
for (const clave of requerido) {
  if (!stacks[clave]) {
    console.error(`[deploy-apps] Falta la salida "${clave}" en ${archivoSalidas}`)
    process.exit(1)
  }
}

const { UrlApi, UserPoolId, UserPoolClientId, BucketRegistro, BucketPanel, DistRegistroId, DistPanelId } = stacks

const pnpm = 'pnpm'
const construir = (filtro, env) =>
  ejecutar(pnpm, ['--filter', filtro, 'build'], { cwd: RAIZ_REPO, env: { ...process.env, ...env } })

console.log('[deploy-apps] Construyendo apps...')
construir('@convencion/registro', { VITE_API_BASE_URL: UrlApi })
construir('@convencion/panel', {
  VITE_API_BASE_URL: UrlApi,
  VITE_COGNITO_USER_POOL_ID: UserPoolId,
  VITE_COGNITO_USER_POOL_CLIENT_ID: UserPoolClientId
})

const publicar = (nombre, bucket, dist, distDir) => {
  console.log(`[deploy-apps] Publicando ${nombre} → s3://${bucket}`)
  ejecutar('aws', [
    's3', 'sync', distDir, `s3://${bucket}`,
    '--delete',
    '--cache-control', NUEVA,
    '--exclude', 'assets/*'
  ])
  ejecutar('aws', [
    's3', 'cp', join(distDir, 'assets'), `s3://${bucket}/assets`,
    '--recursive',
    '--cache-control', PIEDRA
  ])
  ejecutar('aws', [
    'cloudfront', 'create-invalidation',
    '--distribution-id', dist,
    '--paths', '/*'
  ])
}

publicar('registro', BucketRegistro, DistRegistroId, join(RAIZ_REPO, 'apps/registro/dist'))
publicar('panel', BucketPanel, DistPanelId, join(RAIZ_REPO, 'apps/panel/dist'))

const dominio = (clave) => {
  const valor = Object.values(salidas).map((o) => o[clave]).filter(Boolean)[0]
  return valor ?? '(pendiente)'
}
console.log(`[deploy-apps] Listo. Registro → ${dominio('UrlRegistro')} · Panel → ${dominio('UrlPanel')}`)