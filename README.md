# Deploy PHP Application to Lambda With Bref and CDK


## Recap

This workshop relies on Laravel, Bref and CDK.

If you don't know what Bref is or what CDK is, please recap these references listed below.


### Laravel

Laravel is a popular PHP Framework and has a large community base.

References:
- [Laravel](https://laravel.com/)

### Bref

AWS Lambda is not native support for PHP but provides AWS Lambda runtime API and layers. You can build an supportable implementation of PHP by yourself, but it's not easy in my experience.

Now, you can use Bref tool to easily deploy and run serverless PHP applicatons.

Bref relies [serverless framework](https://serverless.com/) and PHP 7.2+.

But what if you don't want to use serverless framework?

You can deploy application manually, develop CloudFormation template or try to develop CDK.

References:
- [Bref](https://bref.sh/)
- [Deploy Serverless Laravel by Bref](https://medium.com/@azole/deploy-serverless-laravel-by-bref-6f28b1e0d53a)
- [Laravel 5.8 with Bref](https://github.com/azole/laravel58-bref)

### AWS CDK

AWS CDK is a software development framework and can implement "Infrastructure IS Code".

Did you notice it? It is not "AS" but "IS".

AWS CDK defines cloud infrastructure in code and provisions it through AWS CloudFormation.

AWS CDK supports TypeScript, JavaScript, and Python. In preview, it also supports C#/.NET and Java.

References:
- [AWS CDK 初探](https://medium.com/@azole/aws-cdk-%E5%88%9D%E6%8E%A2-5b481d3970bd)
- [AWS CDK Guide](https://docs.aws.amazon.com/en_us/cdk/latest/guide/home.html)
- [AWS CDK Workshop](https://cdkworkshop.com/)

## What to Do?

I like AWS CDK very much.

If you have done the AWS CDK workshop, I believe that you have the same feeling.

AWS CDK use object-oriented technicals to create model, use logic to define your infra, and organize your project into logical modules.

As a software engineer, I am so familiar with AWS CDK.

Therefore, I want to use AWS CDK to deploy my PHP Application with Bref.


## How to Start?

First, please implement the bref workshop in my another [repo](https://github.com/azole/laravel58-bref).

If you have already done it, you now have an laravel project with Bref.

After you execute `serverless deploy`, serverless framework generates two CloudFormation Template json files in `.serverless` folder.

One is for creation and another is for updation.

`./serverless/cloudformation-template-create-stack.json` just creates an S3 bucket for uploading lambda code.

`./serverless/cloudformation-template-update-stack.json` is more complicated.

To steamline the process, we revmoe some step in `serverless.yml`.

For example, we remove the building artisan lambda step.

Copy this new [serverless.yml](https://github.com/azole/laravel58-bref-cdk/blob/master/doc/serverless.yml) from doc folder to your bref project and deploy it again (or just synthesize it).

The new CloudFormation Template json files will be generated in .serverless folder.

Observe `./serverless/cloudformation-template-update-stack.json`, which services does it create?

(You also can observe these results in CloudFormation Stack AWS Console.)

- ServerlessDeploymentBucket: create a S3 bucket for uploading lambda zip file
- WebsiteLogGroup: create a CloudWatch log group
- IamRoleLambdaExecution: create an IAM role for execution lambda
- WebsiteLambdaFunction: deploy a lambda function
- WebsiteLambdaVersiongXXXXXX: create a lambda function version
- ApiGatewayRestApi: create an API Gateway Rest API
- ApiGatewayResourceProxyVar: create an api proxy resource for rest api
- ApiGatewayMethodAny: create an ANY method for rest api
- ApiGatewayMethodProxyVarAny: set an ANY method for proxy resource 
- ApiGatewayDeploymentXXXX: deploy this api gateway
- WebsiteLambdaPermissionApiGateway: grant invoke permission to the API

Now, you know which services you need to build.

Do you notice that? We haven't done anything yet, just deploying an empty laravel project. There are so many services we have to build and the CloudFormation Template json file has 347 lines.

Let's try AWS CDK and see how it implements this infra.


## Just Do It

Amogo the resources listed above, the most important services are Lambda Function and API Gateway.

Before we create these services, we have to create laravel project in advance.

### Create Laravel Project with Bref

- Under **PHP 7.2+**, create a Laravel project and install Bref.

```
composer create-project laravel/laravel laravel58-cdk --prefer-dist

cd laravel58-cdk

composer require bref/bref

```

- Update Laravel project to fit Bref serverless environment. Please refer to [Bref document](https://bref.sh/docs/frameworks/laravel.html) or [this article](https://medium.com/@azole/deploy-serverless-laravel-by-bref-6f28b1e0d53a).


### Create a CDK Deploy Project

We create another project and initial it by AWS CDK.

If you don't know how to use AWS CDK, please refer to [AWS CDK Workshop](https://cdkworkshop.com/) or [my previous article first](https://medium.com/@azole/aws-cdk-%E5%88%9D%E6%8E%A2-5b481d3970bd).

```
# the same place as Laravel Project, not inside it.
mkdir laravel58-bref-cdk && cd laravel58-bref-cdk

cdk init -l typescript

cdk bootstrap
```

### Deploy a Lambda Function

```
npm i @aws-cdk/aws-lambda
```

Edit lib/laravel58-bref-cdk-stack.ts

```
import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');

export class Laravel58CdkDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get Bref layer ARN from https://runtimes.bref.sh/
    // At this page, select correct Region and PHP version
    const phpRuntimeLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'lambda-php72-runtime', 'arn:aws:lambda:us-west-2:209497400698:layer:php-72-fpm:10');

    const fn = new lambda.Function(this, 'CDK-Bref-fn', {
        runtime: lambda.Runtime.PROVIDED, // for custom runtime
        code: lambda.Code.fromAsset('../laravel58-cdk'),
        handler: 'public/index.php',
        layers: [phpRuntimeLayer],
    });
}

```

- Import library @aws-cdk/aws-lambda
- Prepare Bref PHP Runtime Layer, you can find it in this page [https://runtimes.bref.sh/](https://runtimes.bref.sh/)
- Deploy lambda function

Notice that you have to decide where the Laravel Project Code is located.

### Add lambda function settings

After we deploy this Laravel application to lambda, we login to AWS Console and test this lambda function.

You can select "Amazon API Gateway AWS Proxy" as event template and update path from "/path/to/resource" to "/" and httpMethod from "POST" to "GET".

```
{
  "body": "eyJ0ZXN0IjoiYm9keSJ9",
  "resource": "/{proxy+}",
  "path": "/",
  "httpMethod": "GET",
  "isBase64Encoded": true,
  ....
}
```

And then, click "Test" button.

Boom! You will get an failed result and an error message as below:

```
{
  "errorMessage": "2019-08-20T05:19:34.565Z xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx Task timed out after 3.00 seconds"
}
```

Scroll donw the web page, you will see the Basic Settings section.

Try to config Memory to 1024 MB and Timeout to 30 seconds and test again.

This time, you can get status code 200 response!

This means that the PHP Runtime Layer works and we deply the Laravel application by CDK successfully.

It is still incomplete because we need to make some settings in AWS Console.

#### Let's do it by AWS CDK.

AWS provides the good [API Reference](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html).

At the API reference page, serach "lambda" and you will find the guide of aws-lambda construct.

Study these documents and you will know how to do it.

- [aws-lambda module](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html)
- [class Function (construct)](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda.Function.html)
- [interface FunctionProps](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda.FunctionProps.html)


```
import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');

export class Laravel58CdkDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const phpRuntimeLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'lambda-php72-runtime', 'arn:aws:lambda:us-west-2:209497400698:layer:php-72-fpm:10');

    const fn = new lambda.Function(this, 'CDK-Bref-fn', {
        runtime: lambda.Runtime.PROVIDED, // for custom runtime
        code: lambda.Code.fromAsset('../laravel58-cdk'),
        handler: 'public/index.php',
        layers: [phpRuntimeLayer],
        // set timeout to 30 seconds
        timeout: Duration.seconds(30),
        // set memory to 1024 MB
        memorySize: 1024,
    });
}
```

After edit the code, you deploy it again and will get the expected result.


### Create a Rest API and Set a ANY Method

So far, we have successfully deployed the Laravel application with Bref to lambda.

That is, we finished the IamRoleLambdaExecution and WebsiteLambdaFunction task in CloudWatch Template json file.

But we still can't connect our website by browser, we need AWS API Gateway to pushlish APIs.

Observe AWS CloudWatch Template, it create a Rest API, set a ANY method to this Rest API, add a proxy resource, and set a ANY method to the proxy resource.

Let's start with a simple one - create a Rest API and add a ANY method to it.

Also, [AWS API Reference](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html) is your good friend.

Study the documents listed as follows:

- [aws-apigateway modul](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigateway-readme.html)
- [class RestApi (construct)](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-apigateway.RestApi.html)
- [class LambdaIntegration](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-apigateway.LambdaIntegration.html)

```
    // ... after lambda function

    // ApiGatewayRestApi
    const api = new apigw.RestApi(this, 'CDK-Bref-api', {
      endpointTypes: [apigw.EndpointType.EDGE],
    });

    // Integration with Lambda function
    const postAPIIntegration = new apigw.LambdaIntegration(fn, {
      proxy: true,
    });

    // ApiGatewayMethodAny
    api.root.addMethod('ANY', postAPIIntegration);
```

Look, it is very simple! Just only 3 functions and you complete the tasks.

Deploy it and go to AWS API Gateway Console. 

You will get "CDK-Bref-api" and go to stages to find out the invoke URL.

Open that invode URL and you can open the laravel application index page.

Until now, we already successfully published this laravel website.

It still has a little bug.

When you try to open http://[Invoke URL]/prod/test, you will get "Internal server error".

```
{
  "message": "Missing Authentication Token"
}
```

Why and how to solve this problem?

### Create a Proxy Resource and set ANY Method to Proxy Resource

Error logs in many cases are very helpful when you're troubleshooting.

By default, the log of API Gateway is disable. You have to set up it by yourself.

Please refer to this link: [Set Up CloudWatch API Logging in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-logging.html)

Do you notice that? You have to handle permissions first.

In AWS CDK, it is more easier than you think. Just add deployOptions listed below:

```
    // ApiGatewayRestApi
    const api = new apigw.RestApi(this, 'CDK-Bref-api', {
      endpointTypes: [apigw.EndpointType.EDGE],
      // enable logging
      deployOptions: {
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      }
    });
```

> By default, an IAM role will be created and associated with API Gateway to allow it to write logs and metrics to AWS CloudWatch unless cloudWatchRole is set to false.  -- [AWS CDK API Reference](https://docs.aws.amazon.com/cdk/api/latest/python/aws_cdk.aws_apigateway.README.html)

When we create API Gateway, we don't need to handle permissions.

After you enable logging for API Gateway, the API Gateway will create the log group named API-Gateway-Execution-Logs_{rest-api-id}/{stage_name} and also create hundreds of log stream for future requests. Don't panic for these hundreds log streama, it's normal.

When the requests start coming in, you'll see those log streams start to record logs.

I told earlier that error logs are very helpful in many cases. Unfortunately, in this case it is not helpful.

We won't get any logs for "Missing Authentication Token".

Try to search in Google and AWS Document, here are some references:

- https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html
- https://kennbrodhagen.net/2016/07/23/how-to-enable-logging-for-api-gateway/

According these document, we need create a proxy resource with greedy path variable of `{proxy+}` and then set a ANY method on the proxy resource.

In fact, we can know it with CloudFormation Tempplate json file generated by serverless framework.

In AWS CDK, it is still easy to create a proxy resource. Just add two lines after add method to root.

```
    ...
    // ApiGatewayMethodAny
    api.root.addMethod('ANY', postAPIIntegration);

    // ApiGatewayResourceProxyVar
    // create a proxy resource
    const resource = api.root.addResource("{proxy+}");
    // set a ANY method to this proxy resource
    resource.addMethod('ANY', postAPIIntegration);

    ...
```

Again, deploy and test. 

Now, you can open http://[Invoke URL]/prod/test and will get 404 Not Found page. 

It's correct because our laravel application doesn't implement the test path route.

The laravel application receives this request and return 404.


### Summary

Compare to the CloudWatch Template:

- There is no need to create S3 bucket.
- There is no need to handle IAM Role and Permission.
- There is no need to deploy API Gateway.
- There is no need to grant invoke permission to the API

lib/laravel58-bref-cdk-stack.ts only has 43 lines.

Do you remember? The CloudWatch Template json file has 347 lines.

If you don't want to rely on serverless framework, AWS CDK is a good choice.

In next session, I'll show you why I prefer AWS CDK than serverless framework.


## Optimize - construct

Create a new file under bin folder called php-deployer.ts with the following content:

```
import cdk = require('@aws-cdk/core');

export interface PHPDeployerProps {
    phpRuntimeLayerARN: string,
    phpCodePath: string,
    handler: string,
}

export class PHPDeployer extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: PHPDeployerProps) {
        super(scope, id);

        // TODO
    }
}

```

Move the deploy code from Laravel58CdkDeployStack to this class and replace some hardcode strings to props.

Please refer to lib/php-develpers.ts file.

Use PHPDeployer to replace the original code in laravel58-cdk-deploy-stack.ts file.

```
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
```

Now, you can publish the PHPDeployer construct as a module or package on npm to your team or to community.

It's great, right?


