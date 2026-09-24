import { CfnOutput, Duration, type Environment, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  PriceClass,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Bucket, BucketEncryption, HttpMethods } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

const ORIGENES_DEV = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]

export class StorageStack extends Stack {
  readonly bucketRegistro: Bucket
  readonly bucketPanel: Bucket
  readonly comprobantesBucket: Bucket
  readonly distribucionRegistro: Distribution
  readonly distribucionPanel: Distribution

  constructor(scope: Construct, id: string, props: StackProps & { env?: Environment }) {
    super(scope, id, props)

    this.comprobantesBucket = new Bucket(this, 'Comprobantes', {
      bucketName: `convencion-2026-comprobantes-${this.account}`,
      encryption: BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'SubidasIncompletas',
          prefix: 'comprobantes/',
          enabled: true,
          abortIncompleteMultipartUploadAfter: Duration.days(7)
        },
        {
          id: 'Orfanos',
          prefix: 'comprobantes/',
          enabled: true,
          expiration: Duration.days(30)
        }
      ],
      removalPolicy: RemovalPolicy.DESTROY
    })

    this.bucketRegistro = this.crearBucketHosting('HostingRegistro')
    this.bucketPanel = this.crearBucketHosting('HostingPanel')

    this.distribucionRegistro = this.crearDistribucion('DistRegistro', this.bucketRegistro)
    this.distribucionPanel = this.crearDistribucion('DistPanel', this.bucketPanel)

    this.comprobantesBucket.addCorsRule({
      allowedMethods: [HttpMethods.PUT, HttpMethods.GET, HttpMethods.HEAD],
      allowedOrigins: [
        ...ORIGENES_DEV,
        `https://${this.distribucionRegistro.domainName}`,
        `https://${this.distribucionPanel.domainName}`
      ],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag'],
      maxAge: 3000
    })

    new CfnOutput(this, 'BucketRegistro', { value: this.bucketRegistro.bucketName })
    new CfnOutput(this, 'BucketPanel', { value: this.bucketPanel.bucketName })
    new CfnOutput(this, 'DistRegistroId', { value: this.distribucionRegistro.distributionId })
    new CfnOutput(this, 'DistPanelId', { value: this.distribucionPanel.distributionId })
    new CfnOutput(this, 'UrlRegistro', { value: `https://${this.distribucionRegistro.domainName}` })
    new CfnOutput(this, 'UrlPanel', { value: `https://${this.distribucionPanel.domainName}` })
  }

  private crearBucketHosting(id: string): Bucket {
    return new Bucket(this, id, {
      encryption: BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY
    })
  }

  private crearDistribucion(id: string, bucket: Bucket): Distribution {
    const origenIdentidad = new OriginAccessIdentity(this, `${id}OrigenIdentidad`)
    bucket.grantRead(origenIdentidad)

    return new Distribution(this, id, {
      defaultBehavior: {
        origin: new S3Origin(bucket, { originAccessIdentity: origenIdentidad }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ],
      priceClass: PriceClass.PRICE_CLASS_100
    })
  }
}