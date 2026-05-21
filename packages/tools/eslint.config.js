import baseConfig from '@foul11/awesome-eslint-config/base';
import nodeConfig from '@foul11/awesome-eslint-config/node';
import cliConfig from '@foul11/awesome-eslint-config/cli';

export default [
    ...baseConfig,
    ...nodeConfig,
    ...cliConfig,
];