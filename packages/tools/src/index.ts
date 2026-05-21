import { hideBin } from 'yargs/helpers';

import command_generateTsConfigs from './commands/generate-tsconfig';
import command_webpack from './commands/webpack';

import yargs from 'yargs';

void yargs(hideBin(process.argv))
    .command(command_generateTsConfigs)
    .command(command_webpack)
    .demandCommand(1, 'Require at least one command')
    .help()
    .alias('help', 'h')
    .parse();