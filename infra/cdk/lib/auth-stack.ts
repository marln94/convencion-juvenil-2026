import { CfnOutput, type Environment, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import {
  AccountRecovery,
  CfnUserPoolGroup,
  UserPool,
  type UserPoolClient
} from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

export interface AuthStackProps extends StackProps {
  env: Environment
}

export class AuthStack extends Stack {
  readonly userPool: UserPool
  readonly clientPanel: UserPoolClient

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props)

    this.userPool = new UserPool(this, 'PoolUsuarios', {
      userPoolName: 'Convencion-2026-Pool',
      selfSignUpEnabled: false,
      signInAliases: { username: true, email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY
    })

    this.clientPanel = this.userPool.addClient('ClientePanel', {
      userPoolClientName: 'panel',
      generateSecret: false,
      authFlows: { userSrp: true },
      preventUserExistenceErrors: true
    })

    const crearGrupo = (nombre: string, prioridad: number, descripcion: string): void => {
      new CfnUserPoolGroup(this, `Grupo${Capitalizar(nombre)}`, {
        userPoolId: this.userPool.userPoolId,
        groupName: nombre,
        precedence: prioridad,
        description: descripcion
      })
    }
    crearGrupo('admin', 1, 'Administradores del sistema')
    crearGrupo('staff', 2, 'Personal de campo (check-in y registro in situ)')

    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId })
    new CfnOutput(this, 'UserPoolClientId', { value: this.clientPanel.userPoolClientId })
  }

  get jwksUrl(): string {
    return `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}/.well-known/jwks.json`
  }
}

function Capitalizar(nombre: string): string {
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}