import { type Environment, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export interface DataStackProps extends StackProps {
  env: Environment
}

export class DataStack extends Stack {
  readonly participantesTable: Table
  readonly configuracionTable: Table
  readonly participantesTableName: string
  readonly configuracionTableName: string

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props)

    const participantes = new Table(this, 'Participantes', {
      partitionKey: { name: 'participantId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true
    })

    participantes.addGlobalSecondaryIndex({
      indexName: 'GSI-EstadoPago',
      partitionKey: { name: 'estadoPago', type: AttributeType.STRING },
      sortKey: { name: 'fechaRegistro', type: AttributeType.STRING }
    })

    participantes.addGlobalSecondaryIndex({
      indexName: 'GSI-Equipo',
      partitionKey: { name: 'equipoColor', type: AttributeType.STRING },
      sortKey: { name: 'nombre', type: AttributeType.STRING }
    })

    const configuracion = new Table(this, 'Configuracion', {
      partitionKey: { name: 'clave', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    })

    this.participantesTable = participantes
    this.configuracionTable = configuracion
    this.participantesTableName = participantes.tableName
    this.configuracionTableName = configuracion.tableName
  }
}