import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import { Duration } from '@aws-cdk/core';

export class Laravel58CdkDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const phpRuntimeLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'lambda-php72-runtime', 'arn:aws:lambda:us-west-2:209497400698:layer:php-72-fpm:10');

    const fn = new lambda.Function(this, 'CDK-Bref-fn', {
        runtime: lambda.Runtime.PROVIDED,
        code: lambda.Code.fromAsset('../laravel58-cdk'),
        handler: 'public/index.php',
        layers: [phpRuntimeLayer],
        timeout: Duration.seconds(30),
        memorySize: 1024,
    });

  }
}
