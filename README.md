# Deploy PHP Application to Lambda With Bref and CDK


## Recap

This workshop relies on Laravel, Bref and CDK.

If you don't know what Bref is or what CDK is, please recap these references listed as below.


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

Copy this new serverless.yml from doc folder to your bref project and deploy it again (or just synthesize it).

You can get a new CloudFormation Template json files in .serverless folder.

Observe this the creation json, which services does it create?

(You also can observe thess results in CloudFormation Stack AWS Console.)

- ServerlessDeploymentBucket: create a S3 bucket for uploading lambda zip file
- WebsiteLogGroup: create a CloudWatch log group
- IamRoleLambdaExecution: create an IAM role for execution lambda
- WebsiteLambdaFunction: deploy a lambda function
- WebsiteLambdaVersiongXXXXXX: create a lambda function version
- ApiGatewayRestApi: create an API Gateway Rest API
- ApiGatewayResourceProxyVar: create an api resource for rest api
- ApiGatewayMethodAny: create an ANY method for rest api
- ApiGatewayMethodProxyVarAny: create an ANY method for resource 
- ApiGatewayDeploymentXXXX: deploy this api gateway
- WebsiteLambdaPermissionApiGateway: grant invoke permission to the API

Now, you know which services you need to build.

We haven't done anything yet, just deploying an empty laravel project. There are so many services we have to build and the CloudFormation Template json file has 347 lines.

Let's try AWS CDK and see how it implement this infra.


## Just Do It

Amogo the resources listed above, the most important services are Lambda Function and API Gateway.

Before we create these services, we have to create laravel project in advance.

### Create Laravel Project with Bref

- install serverless framework

- Under **PHP 7.2+**, create a Laravel project and install Bref.

```
composer create-project laravel/laravel laravel58-cdk --prefer-dist

cd laravel58-cdk

composer require bref/bref

```

- Update Laravel project to fit Bref serverless environment. Please refer to [Bref document](https://bref.sh/docs/frameworks/laravel.html) or [this article](https://medium.com/@azole/deploy-serverless-laravel-by-bref-6f28b1e0d53a).


### Create a CDK Deploy Project

We create another project and initial by CDK.

If you don't know how to use CDK, please refer to [AWS CDK Workshop](https://cdkworkshop.com/) or [my previous article first](https://medium.com/@azole/aws-cdk-%E5%88%9D%E6%8E%A2-5b481d3970bd).

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

    const phpRuntimeLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'lambda-php72-runtime', 'arn:aws:lambda:us-west-2:209497400698:layer:php-72-fpm:10');

    new lambda.Function(this, 'CDK-Bref-fn', {
        runtime: lambda.Runtime.PROVIDED,
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

### Create a Rest API and Add ANY Method

TBD

### Create a Resource and Add ANY Method

TBD

### Summary


Compare to the CloudWatch Template:

- There is no need to create S3 bucket.
- There is no need to handle IAM Role and Permission.
- There is no need to deploy API Gateway.
- There is no need to grant invoke permission to the API

lib/laravel58-bref-cdk-stack.ts only has 39 lines. 

Do you remember? The CloudWatch Template json file has 347 lines.

If you don't want to rely on serverless framework, AWS CDK is a good choice.

In next session, I'll show you why I prefer AWS CDK than serverless framework.


## Optimize - construct

TBD
