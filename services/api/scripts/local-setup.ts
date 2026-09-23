// Configura los recursos locales (DynamoDB Local + MinIO) usados por services/api.
// Requiere que los contenedores de docker-compose.local.yml estén arriba.
// Uso: pnpm setup:local  (carga .env.local si existe)

import { existsSync } from 'node:fs'

import { CreateBucketCommand, ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'
import { CreateTableCommand, DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'

if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const endpointDynamo = process.env.DYNAMODB_ENDPOINT
const endpointS3 = process.env.S3_ENDPOINT
const tabla = process.env.PARTICIPANTES_TABLE ?? 'Convencion-Participantes'
const tablaConfiguracion = process.env.CONFIGURACION_TABLE ?? 'Convencion-Configuracion'
const bucket = process.env.COMPROBANTES_BUCKET ?? 'convencion-comprobantes'

if (!endpointDynamo || !endpointS3) {
  console.error('Falta DYNAMODB_ENDPOINT o S3_ENDPOINT. Levantá docker-compose.local.yml y copiá .env.example a .env.local')
  process.exit(1)
}

const credenciales = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'minioadmin',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'minioadmin'
}

const dynamo = new DynamoDBClient({ region: 'us-east-1', endpoint: endpointDynamo, credentials: credenciales })
const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: endpointS3,
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  credentials: credenciales
})

async function esperar(predicado: () => Promise<boolean>, nombre: string): Promise<void> {
  for (let intento = 1; intento <= 30; intento++) {
    if (await predicado()) {
      return
    }
    console.log(`esperando a ${nombre} (intento ${intento}/30)…`)
    await new Promise((resolver) => setTimeout(resolver, 1000))
  }
  throw new Error(`${nombre} no respondió a tiempo`)
}

async function crearTabla(nombre: string, clave: string): Promise<void> {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: nombre,
        KeySchema: [{ AttributeName: clave, KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: clave, AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST'
      })
    )
    console.log(`tabla ${nombre} creada`)
  } catch (error) {
    const mensaje = (error as { name?: string }).name
    if (mensaje === 'ResourceInUseException') {
      console.log(`tabla ${nombre} ya existe`)
      return
    }
    throw error
  }
}

async function configurarBucket(): Promise<void> {
  const existentes = await s3.send(new ListBucketsCommand({}))
  const yaExiste = existentes.Buckets?.some((b) => b.Name === bucket)
  if (!yaExiste) {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))
    console.log(`bucket ${bucket} creado`)
  } else {
    console.log(`bucket ${bucket} ya existe`)
  }

  // MinIO (edición comunitaria) no implementa PutBucketCors; el CORS del PUT del
  // navegador se habilita globalmente con MINIO_API_CORS_ALLOW_ORIGIN en el compose.
  console.log('CORS del PUT resuelto por MINIO_API_CORS_ALLOW_ORIGIN (compose local)')
}

await esperar(async () => {
  try {
    await dynamo.send(new ListTablesCommand({}))
    return true
  } catch {
    return false
  }
}, 'DynamoDB Local')

await esperar(async () => {
  try {
    await s3.send(new ListBucketsCommand({}))
    return true
  } catch {
    return false
  }
}, 'MinIO')

await crearTabla(tabla, 'participantId')
await crearTabla(tablaConfiguracion, 'clave')
await configurarBucket()

console.log('Setup local completo.')