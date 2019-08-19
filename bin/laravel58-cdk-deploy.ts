#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { Laravel58CdkDeployStack } from '../lib/laravel58-cdk-deploy-stack';

const app = new cdk.App();
new Laravel58CdkDeployStack(app, 'Laravel58CdkDeployStack');
