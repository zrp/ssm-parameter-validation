# SSM Parameter Validation

SSM Parameter Validation is a package that validate if all the variables listed in docker-compose are configured in SSM (System Manager in AWS) as environment variables.

This works for projects that locally are docker based (and uses docker compose) and in production uses SSM as environment parameters control.

## How to use

### In your machine

Install the package in your dev-dependencies:

```
npm install @zrpaplicacoes/ssm-parameter-validation --save-dev
```

And then import the file in your code to use:

```
const { ssmValidation } = require('./index.js');

ssmValidation(config);
```

You can both configure your project variables through [config file](#through-config-file) or [environment variables](#through-environment-variables).

### Through CLI

Simply run:

```
npx @zrpaplicacoes/ssm-parameter-validation execute
```

### Using docker

Docker only supports configuration through [environment variables](#through-environment-variables), so run:

```
docker run -v /${PWD}/docker-compose.yml:/home/node/app/docker-compose.yml -e AWS_REGION='<<region>>' -e AWS_SECRET_ACCESS_KEY='<<config>>' -e AWS_ACCESS_KEY_ID='<<config>>' -e PARAMETERS_PATH='<<config>>' -e IGNORE_PARAMETERS='<<config>> ssm-parameter-validation'
```

## Configuration

### Through Config File

This package accepts a config file as configuration which is a JS objects with:

```
{
  aws: {
    region: your aws region,
    awsSecretAccessKey: your secret key (DO NOT COMMIT THAT),
    awsAccessKeyId: your access key,
  },
  ignoreParameters: parameters that you want to ignore, a string with comma separeted parameters,
  parametersPath: where should this package search for parameters in ssm,
}
```

### Through Environment Variables

Your must just define the following environment variables:

AWS_REGION='your aws region'
AWS_SECRET_ACCESS_KEY='your secret key (DO NOT COMMIT THAT)'
AWS_ACCESS_KEY_ID='your access key'
IGNORE_PARAMETERS='parameters that you want to ignore, a string with comma separeted parameters'
PARAMETERS_PATH='where should this package search for parameters in ssm'
