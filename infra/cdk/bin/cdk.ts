#!/usr/bin/env node
import 'source-map-support/register.js'

import * as cdk from 'aws-cdk-lib'

import { ApiStack } from '../lib/api-stack.js'
import { AuthStack } from '../lib/auth-stack.js'
import { DataStack } from '../lib/data-stack.js'
import { StorageStack } from '../lib/storage-stack.js'

const app = new cdk.App()

const region = app.node.tryGetContext('region') ?? process.env.CDK_DEFAULT_REGION ?? 'us-east-1'
const account = app.node.tryGetContext('account') ?? process.env.CDK_DEFAULT_ACCOUNT
const env: cdk.Environment = { account, region }

const auth = new AuthStack(app, 'AuthStack', { env })
const data = new DataStack(app, 'DataStack', { env })
const storage = new StorageStack(app, 'StorageStack', { env })

const api = new ApiStack(app, 'ApiStack', {
  env,
  region,
  userPool: auth.userPool,
  participantesTable: data.participantesTable,
  configuracionTable: data.configuracionTable,
  comprobantesBucket: storage.comprobantesBucket
})

api.node.addDependency(auth, data, storage)

cdk.Tags.of(app).add('aplicacion', 'convencion-juvenil-2026')
cdk.Tags.of(app).add('entorno', 'produccion')