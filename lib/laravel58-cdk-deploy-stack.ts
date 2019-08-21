import cdk = require('@aws-cdk/core');
import { PHPDeployer } from './php-deployer';

export class Laravel58CdkDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get Bref layer ARN from https://runtimes.bref.sh/
    new PHPDeployer(this, 'HelloPHPDeployer', {
      phpRuntimeLayerARN: 'arn:aws:lambda:us-west-2:209497400698:layer:php-72-fpm:10',
      phpCodePath: '../laravel58-cdk',
      handler: 'public/index.php'
    });
  }
}