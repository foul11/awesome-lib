import { hideBin } from 'yargs/helpers';

import command_generateTsConfigs from './commands/generate-tsconfig';
import command_webpack from './commands/webpack';
import command_mono from './commands/mono';

import yargs from 'yargs';

void yargs(hideBin(process.argv))
    .command(command_generateTsConfigs)
    .command(command_webpack)
    .command(command_mono)
    
    .scriptName('awesome-tools')
    .demandCommand(1)
    .alias('help', 'h')
    .help()
    
    .parse();