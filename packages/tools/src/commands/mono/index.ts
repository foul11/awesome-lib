import { defineCommand, type InferCommandArgs } from '../../utils';
import command_init from './init';

export type MonoParams = InferCommandArgs<typeof command>;

const command = defineCommand({
    command: 'mono',
    describe: 'Управление созданием и обновлением моно-репозитория',
    builder: async yargs => yargs
        .demandCommand(1)
        .recommendCommands()
        .command(command_init),
    handler: command_mono as any,
});

async function command_mono(options: MonoParams) {
    throw new Error('No args passed');
}

export default command;
