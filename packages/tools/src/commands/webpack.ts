import { findUp } from 'find-up';
import { merge } from 'webpack-merge';
import { pathToFileURL } from 'node:url';
import { defineCommand, isDev, type InferCommandArgs } from '../utils';

import path from 'node:path';
import util from 'node:util';
import webpack from 'webpack';

export type WebpackParams = InferCommandArgs<typeof command>;

const command = defineCommand({
    command: 'webpack',
    describe: 'custom webpack-cli',
    builder: async yargs => yargs
        .option('entry', {
            alias: 'e',
            type: 'array',
            string: true,
            description: 'Entry files',
        })
        .option('target', {
            alias: 't',
            type: 'string',
            description: 'Build target',
            choices: [ 'cli', 'lib', 'react' ],
            demandOption: true,
        })
        .option('config', {
            alias: 'c',
            type: 'string',
            description: 'Webpack config file: webpack.[jt]s',
        })
        .option('print-config', {
            type: 'boolean',
            description: 'Print final webpack config',
        })
        .option('watch', {
            alias: 'w',
            type: 'boolean',
            description: 'Watch mode',
            default: false,
        })
        .option('mode', {
            alias: 'm',
            type: 'string',
            choices: [ 'development', 'production', 'none' ] as const,
            demandOption: true,
            default: isDev(process.env.NODE_ENV, false)
                ? 'development' as const
                : 'production' as const,
        })
        .option('project', {
            alias: 'p',
            type: 'string',
            demandOption: true,
            default: await findUp('package.json', { cwd: process.cwd() }),
        }),
    handler: command_webpack as any,
});

async function loadConfigAsObject(configPath: string, args?: Record<string, any>): Promise<webpack.Configuration> {
    let options = await import(configPath);
    
    if (options && typeof options === 'object' && 'default' in options) {
        options = options.default;
    }
    
    if (options && typeof options === 'function') {
        options = options(process.env, args);
    }
    
    return options;
}

async function command_webpack(options: WebpackParams) {
    let conf = merge(
        await loadConfigAsObject('../webpack/base', options),
        await loadConfigAsObject(`../webpack/${options.target}`, options),
    );
    
    if (options.config) {
        const configPath = path.resolve(process.cwd(), options.config);
        const configUrl = pathToFileURL(configPath).href;
        
        conf = merge(conf, await loadConfigAsObject(configUrl, options));
    }
    
    if (options.printConfig) {
        console.log(
            util.inspect(conf, {
                compact: true,
                colors: true,
                depth: 10,
            }),
        );
        
        process.exit(0);
    }
    
    const compiler = webpack(conf);
    return new Promise<void>((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                console.error(err.message);
                process.exit(2);
            }
            
            if (stats && (stats.hasErrors() || (options.failOnWarnings && stats.hasWarnings()))) {
                process.exitCode = 1;
            }
            
            if (!stats) {
                return reject(new Error('No stats'));
            }
            
            const statsOptions = (compiler as any).compilers
                ? { children: (compiler as any).compilers.map((child_compiler: any) => child_compiler.options.stats) }
                : compiler.options.stats;
            
            const printedStats = stats.toString(
                typeof statsOptions === 'object' ? {
                    ...statsOptions,
                    colors: true,
                } : statsOptions,
            );
            
            if (printedStats) {
                console.log(printedStats);
            }
            
            return resolve();
        });
    });
}

export default command;
