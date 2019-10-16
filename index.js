const yaml = require('js-yaml');
const fs = require('fs');
const awsParamStore = require('aws-param-store');
const chalk = require('chalk');

const { log } = console;

const fillWithEnvironmentVariables = (config) => ({
  aws: {
    region: process.env.AWS_REGION,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  },
  ignoreParameters: process.env.IGNORE_PARAMETERS,
  parametersPath: process.env.PARAMETERS_PATH,
  ...config,
});

const getStoreParameters = async (path, config) => {
  const instance = awsParamStore.parameterQuery({
    region: config.aws.region,
    awsSecretAccessKey: config.aws.awsSecretAccessKey,
    awsAccessKeyId: config.aws.awsAccessKeyId,
  });
  /* disable decription of secure strings, we dont use the data of the paramenters */
  instance.decryption(false);
  const params = await instance.path(path).execute();
  return params
    .map((param) => param.Name.split('/')[2]);
};

const getComposeParamaters = (ignoredParameters) => {
  const doc = yaml.safeLoad(fs.readFileSync('./docker-compose.yml', 'utf8'));
  const data = doc.services.app.environment;
  const keys = Object.keys(data);
  return keys.filter((key) => !ignoredParameters.includes(key));
};

const validateParameters = (composeParameters, storeParameters) => (
  composeParameters.filter((param) => !storeParameters.includes(param))
);

const logArray = (data, message, color) => {
  if (message) log(chalk.bold[color](message));
  data.forEach((item) => {
    log(` - ${item}`);
  });
  log('\n');
};

const mapIgnoredParameters = (config) => {
  let ignoredParameters = [];
  if (config.ignoreParameters) {
    ignoredParameters = config.ignoreParameters.split(/,\s|\s,\s|\s,|,/);
  }
  logArray(ignoredParameters, 'Ignored parameters:', 'cyan');
  return ignoredParameters;
};


async function ssmValidation(config) {
  try {
    log(`Start execution at ${new Date()}\n`);

    config = fillWithEnvironmentVariables(config);

    const ignoredParameters = mapIgnoredParameters(config);
    const paramentersPath = config.parametersPath || '';

    const composeParameters = await getComposeParamaters(ignoredParameters);
    const storeParameters = await getStoreParameters(paramentersPath, config);
    const result = validateParameters(composeParameters, storeParameters);

    if (result.length === 0) {
      log(chalk.bold.green('All params found. Everything is fine!'));
      log(`Finish execution at ${new Date()}\n`);
      process.exit(0);
    } else {
      logArray(result, 'Not found Parameters:', 'red');
      log(`Finish execution at ${new Date()}\n`);
      process.exit(1);
    }
  } catch (err) {
    log(chalk.bold.red('Something happened'), err);
    process.exit(1);
  }
}

module.exports = {
  ssmValidation,
}
