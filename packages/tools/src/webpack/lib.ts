import path from 'node:path';

import { findTsConfig } from '../utils';
import type webpack from 'webpack';
import type { WebpackParams } from '../commands/webpack';

export default (env: any, args: WebpackParams): webpack.Configuration => {
    const projectJsonDir = path.dirname(args.project);
    const tsConfigsPath = findTsConfig(projectJsonDir);
    
    return {
        target: 'node',
        devtool: 'nosources-source-map',
        output: {
            library: {
                type: 'module',
            },
            devtoolModuleFilenameTemplate(info) {
                if (path.isAbsolute(info.absoluteResourcePath)) {
                    return path.relative(projectJsonDir, info.absoluteResourcePath);
                }
                
                return '';
            },
        },
        experiments: {
            outputModule: true,
        },
        externalsPresets: {
            node: true,
        },
        externals: [
            function ({ request }, callback) {
                if (request.startsWith('.') || request.startsWith('/')) {
                    return callback();
                }
                
                return callback(null, `module ${request}`);
            },
        ],
        optimization: {
            minimize: false,
            nodeEnv: false,
        },
        resolveLoader: {
            alias: {
                'ts-loader': import.meta.resolve('ts-loader'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.(j|t)sx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: false,
                            configFile: tsConfigsPath,
                        },
                    },
                },
            ],
        },
    };
};
