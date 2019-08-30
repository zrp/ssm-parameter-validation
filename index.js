require('dotenv').config();
const yaml = require('js-yaml');
const fs = require('fs');
const awsParamStore = require('aws-param-store');
const chalk = require('chalk');

const { log } = console;

const getStoreParameters = async (path) => {
  const instance = awsParamStore.parameterQuery({ region: 'us-east-1' });
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

const mapIgnoredParameters = () => {
  let ignoredParameters = [];
  if (process.env.IGNORE_PARAMETERS) {
    ignoredParameters = process.env.IGNORE_PARAMETERS.split(', ');
  }
  logArray(ignoredParameters, 'Ignored parameters:', 'cyan');
  return ignoredParameters;
};

(async function init() {
  try {
    log(`Start execution at ${new Date()}\n`);

    const ignoredParameters = mapIgnoredParameters();
    const paramentersPath = process.env.PARAMETERS_PATH || '';

    const composeParameters = await getComposeParamaters(ignoredParameters);
    const storeParameters = await getStoreParameters(paramentersPath);
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
}());
