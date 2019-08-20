import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import { Duration } from '@aws-cdk/core';
import apigw = require('@aws-cdk/aws-apigateway');

export class Laravel58CdkDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get Bref layer ARN from https://runtimes.bref.sh/
    const phpRuntimeLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'lambda-php72-runtime', 'arn:aws:lambda:us-west-2:209497400698:layer:php-72-fpm:10');

    const fn = new lambda.Function(this, 'CDK-Bref-fn', {
        runtime: lambda.Runtime.PROVIDED, // for custom runtime
        code: lambda.Code.fromAsset('../laravel58-cdk'),
        handler: 'public/index.php',
        layers: [phpRuntimeLayer],
        timeout: Duration.seconds(30), // set timeout to 30 seconds
        memorySize: 1024, // set memory to 1024 MB
    });

    // ApiGatewayRestApi
    const api = new apigw.RestApi(this, 'CDK-Bref-api', {
      endpointTypes: [apigw.EndpointType.EDGE],
      // enable logging
      deployOptions: {
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      }
    });

    // Integration with Lambda function
    const postAPIIntegration = new apigw.LambdaIntegration(fn, {
      proxy: true,
    });

    // ApiGatewayMethodAny
    api.root.addMethod('ANY', postAPIIntegration);

    // ApiGatewayResourceProxyVar
    // const resource = api.root.addResource("{proxy+}");
    // resource.addMethod('ANY', postAPIIntegration);

  }
}
