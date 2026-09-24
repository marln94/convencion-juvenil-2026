import { CfnOutput, Duration, type Environment, Stack, type StackProps } from 'aws-cdk-lib'
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  type Resource,
  ResponseType,
  RestApi
} from 'aws-cdk-lib/aws-apigateway'
import type { IUserPool } from 'aws-cdk-lib/aws-cognito'
import type { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import type { IBucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR_LAMBDAS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist-lambda')

export interface ApiStackProps extends StackProps {
  env: Environment
  region: string
  userPool: IUserPool
  participantesTable: ITable
  configuracionTable: ITable
  comprobantesBucket: IBucket
}

export class ApiStack extends Stack {
  readonly urlApi: string

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const api = new RestApi(this, 'Api', {
      restApiName: 'Convencion-2026-Api',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS.concat('Authorization')
      }
    })

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'AuthorizerCognito', {
      cognitoUserPools: [props.userPool]
    })

    api.addGatewayResponse('UnauthorizedConCors', {
      type: ResponseType.UNAUTHORIZED,
      responseHeaders: {
        'Access-Control-Allow-Origin': 'method.request.header.Origin',
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'GET,POST,PATCH,PUT,DELETE,OPTIONS'"
      }
    })

    const crearLambda = (nombre: string, carpeta: string): Function => {
      const fn = new Function(this, `Lambda${nombre}`, {
        code: Code.fromAsset(join(DIR_LAMBDAS, carpeta)),
        handler: 'index.handler',
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 256,
        environment: {
          PARTICIPANTES_TABLE: props.participantesTable.tableName,
          CONFIGURACION_TABLE: props.configuracionTable.tableName,
          COMPROBANTES_BUCKET: props.comprobantesBucket.bucketName,
          COGNITO_REGION: props.region,
          COGNITO_JWKS_URL: `https://cognito-idp.${props.region}.amazonaws.com/${props.userPool.userPoolId}/.well-known/jwks.json`
        }
      })
      props.participantesTable.grantReadWriteData(fn)
      props.configuracionTable.grantReadWriteData(fn)
      if (nombre === 'Registro' || nombre === 'RevisarPago') {
        props.comprobantesBucket.grantReadWrite(fn)
      }
      return fn
    }

    const registro = crearLambda('Registro', 'registro')
    const listado = crearLambda('Listado', 'listado')
    const revisarPago = crearLambda('RevisarPago', 'revisar-pago')
    const equipos = crearLambda('Equipos', 'equipos')
    const checkin = crearLambda('Checkin', 'checkin')

    const agregarMetodo = (
      recurso: Resource,
      verbo: string,
      fn: Function,
      publico: boolean
    ): void => {
      recurso.addMethod(verbo, new LambdaIntegration(fn), {
        authorizationType: publico ? AuthorizationType.NONE : AuthorizationType.COGNITO,
        authorizer: publico ? undefined : authorizer
      })
    }

    const inscripciones = api.root.addResource('inscripciones')
    const subidas = inscripciones.addResource('comprobante-upload')
    agregarMetodo(inscripciones, 'POST', registro, true)
    agregarMetodo(subidas, 'POST', registro, true)
    agregarMetodo(inscripciones, 'GET', listado, false)
    agregarMetodo(inscripciones.addResource('{id}'), 'GET', listado, false)

    const pagos = api.root.addResource('pagos')
    agregarMetodo(pagos.addResource('{estado}'), 'GET', revisarPago, false)
    agregarMetodo(pagos.addResource('revisar'), 'POST', revisarPago, false)

    const equiposRuta = api.root.addResource('equipos')
    agregarMetodo(equiposRuta, 'GET', equipos, false)
    agregarMetodo(equiposRuta.addResource('generar'), 'POST', equipos, false)
    agregarMetodo(equiposRuta.addResource('bloquear'), 'POST', equipos, false)
    agregarMetodo(equiposRuta.addResource('config'), 'POST', equipos, false)
    agregarMetodo(equiposRuta.addResource('{color}'), 'GET', equipos, false)

    agregarMetodo(api.root.addResource('checkin'), 'POST', checkin, false)

    this.urlApi = api.url
    new CfnOutput(this, 'UrlApi', { value: api.url })
  }
}