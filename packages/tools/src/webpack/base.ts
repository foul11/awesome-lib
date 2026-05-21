import path from 'node:path';

// import WebpackCopy from 'copy-webpack-plugin';
// import WebpackObfuscator from '@foul11/webpack-obfuscator';
import WebpackBar from 'webpackbar';
// import bindings from 'bindings';

// import { isTrue } from '../utils';
import { findTsConfig, readTsConfig, webpackFileEntries } from '../utils';

import type webpack from 'webpack';
import type { WebpackParams } from '../commands/webpack';

// const workspace = process.cwd();
// const incObfsNModules: string[] = [
//     // 'flexi-lib',
//     // 'flexi-bot',
// ];

// function debugObfsFiles(filtered: boolean, ...args: unknown[]) {
//     if (!filtered)
//         console.log(...args);
    
//     return filtered;
// }

const babelPresetEnvPath = import.meta.resolve('@babel/preset-env');
const babelPresetTypescriptPath = import.meta.resolve('@babel/preset-typescript');
const babelPluginSourceMapSupportPath = import.meta.resolve('babel-plugin-source-map-support');

export default (env: any, args: WebpackParams): webpack.Configuration => {
    // const isDev = !!(process.env.NODE_ENV?.toLowerCase()?.slice(0, 3) === 'dev');
    // const use_plugin_copy_node = isTrue(process.env.BUILD_COPY_NODE, true);
    // const use_obfuscate = isTrue(process.env.BUILD_USE_OBFUSCATE, true);
    // const use_obfuscate_debug = isTrue(process.env.BUILD_USE_OBFUSCATE_DEBUG, false);
    
    const projectJsonDir = path.dirname(args.project);
    const projectJsonPath = path.join(projectJsonDir, 'package.json');
    const tsConfigsPath = findTsConfig(projectJsonDir);
    
    if (!tsConfigsPath) {
        console.error(`tsconfig.build.json or tsconfig.json not found in ${projectJsonDir}`);
        process.exit(1);
    }
    
    const tsConfig = readTsConfig(tsConfigsPath);
    
    const buildDir = path.resolve(projectJsonDir, tsConfig.options.outDir ?? './dist');
    const sourceDir = path.resolve(projectJsonDir, tsConfig.options.rootDir ?? './src');
    
    return {
        watch: args.watch,
        mode: args.mode,
        devtool: args.mode === 'development' ? 'source-map' : false,
        // target: 'node',
        // externalsPresets: { node: true },
        // externals: {
        //     'express': `require('express')`,
        //     'better-sqlite3': `require('better-sqlite3')`,
        // },
        entry: webpackFileEntries(projectJsonPath, args.entry, {
            buildDir,
            sourceDir,
        }),
        output: {
            path: buildDir,
            clean: true,
        },
        // output: {
        //     filename: '[name].cjs',
        //     path: path.join(workspace, process.env.BUILD_DIR ?? './dist'),
        //     clean: true,
        //     chunkFormat: false,
        // },
        plugins: [
            new WebpackBar(),
            
            // use_plugin_copy_node && (
            //     new WebpackCopy({
            //         patterns: [{
            //             from: bindings({
            //                 module_root: path.dirname(require.resolve('better-sqlite3/package.json')),
            //                 bindings: 'better_sqlite3.node',
            //                 path: true,
            //             }),
            //             to: 'better_sqlite3.node',
            //         }],
            //     })
            // ),
        ],
        resolveLoader: {
            alias: {
                'babel-loader': import.meta.resolve('babel-loader'),
            },
        },
        resolve: {
            extensions: [ '.js', '.jsx', '.ts', '.d.ts', '.tsx', '.node' ],
            symlinks: true,  // работает как false, но в flexi-front ситуация обратная,
                             // если не будет работать, попробовать по менять и/или переустановить node_modules
                             // Module parse failed: 'import' and 'export' may appear only with 'sourceType: module' (1:18063)
                             // Каким то боком оказалась из-за symlinks: true, пиздец какой то
                             // udp: если модуль будет ссылкой в node_module и скомпилирован в es6, то все работает если symlinks: true
                             //      если модуль это commonjs, то работает при symlinks: false, причины такого поведения не понятны
        },
        module: {
            rules: [
                // {
                //     test: /.+\.[jt]s$/,
                //     exclude: (module => (
                //         debugObfsFiles(incObfsNModules.every((m) => {
                //             const idx = module.indexOf(m);
                            
                //             if (idx === -1)
                //                 return true;
                            
                //             return module.slice(idx).includes('node_modules');
                //         }), module)
                //     )),
                //     use: [
                //         use_obfuscate && {
                //             loader: WebpackObfuscator.loader,
                //             options: {
                //                 target: 'node',
                //                 seed: 0,
                //                 log: false,
                //                 // disableConsoleOutput: !use_obfuscate_debug, // Для node приложений не нужно
                //                 // selfDefending: true,
                //                 sourceMap: true,
                //                 compact: true,
                //                 debugProtection: !use_obfuscate_debug,
                //                 debugProtectionInterval: 2000,
                //                 controlFlowFlattening: false, // если включен, снижает производительность до 1.5 раз при threshold = 1
                //                 controlFlowFlatteningThreshold: 1,
                //                 deadCodeInjection: true,
                //                 deadCodeInjectionThreshold: 0.25,
                //                 numbersToExpressions: false, // если включено, теоретически может сломать код, из-за накапливающейся ошибки
                //                 renameGlobals: false,        // если включено, может сломать код
                //                 simplify: true,
                //                 identifierNamesGenerator: 'hexadecimal', // по умолчанию стоит 'hexadecimal', и теперь понятно почему, mangle тупо не знает что в коде есть такие переменные
                //                 splitStrings: false,
                //                 splitStringsChunkLength: 5,
                                
                //                 // stringArray: true, // Каким то образом влияет на номера строк при отладке внутри callback'ов, временно отключено, для упрощения отладки prod кода
                //                 stringArray: !use_obfuscate_debug,
                //                 stringArrayCallsTransform: true,
                //                 stringArrayEncoding: [ 'rc4' ],
                //                 stringArrayIndexShift: true,
                //                 stringArrayRotate: true,
                //                 stringArrayShuffle: true,
                //                 stringArrayWrappersCount: 5,
                //                 stringArrayWrappersChainedCalls: true,
                //                 stringArrayWrappersParametersMaxCount: 5,
                //                 stringArrayWrappersType: 'function',
                //                 stringArrayThreshold: 1,
                //                 transformObjectKeys: true,
                //                 // transformObjectKeys: false,
                //                 unicodeEscapeSequence: false, // просто увеличивает размер кода, для небольших кодовых баз
                                
                //                 // reservedNames: [ '^require$', '^require\\.context$' ], // не нужно для работы?
                //                 // reservedStrings: ,
                //             },
                //         },
                //     ],
                //     resolve: {
                //         fullySpecified: false,
                //     },
                // },
                {
                    test: /.+\.[jt]sx?$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [ babelPresetTypescriptPath ],
                                [ babelPresetEnvPath ],
                            ],
                            sourceMaps: true,
                            // plugins: [
                            //     'source-map-support',
                            // ],
                        },
                    }],
                    resolve: {
                        fullySpecified: false,
                    },
                },
            ],
        },
        // optimization: {
        //     splitChunks: false,
        //     runtimeChunk: false,
        // },
    };
};
