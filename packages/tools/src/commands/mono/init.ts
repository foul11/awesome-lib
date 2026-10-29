/* spell-checker: words jscoverage pids */

import { defineCommand, findMonorepoRoot, type InferCommandArgs } from '../../utils';
import { hereDoc as hd } from '@foul11/awesome-lang';

import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

export type CommandParams = InferCommandArgs<typeof command>;

const command = defineCommand({
    command: 'init [name]',
    describe: 'инициализирует моно-репозиторий и/или создает новый package',
    builder: async yargs => yargs
        .positional('name', {
            type: 'string',
            description: 'Package name',
        }),
    handler: command_handler as any,
});

interface GetRootPackageJsonOpts {
    name: string
    author: string
}

function get_root_package_json(opts: GetRootPackageJsonOpts) {
    return JSON.stringify({
        'name': opts.name,
        'version': '1.0.0',
        'author': opts.author,
        'license': 'UNLICENSED',
        'private': true,
        'type': 'module',
        'scripts': {
            'build': 'lerna run build --include-dependencies',
            'test': 'lerna run test',
            'watch': 'lerna run watch',
            'eslint': 'lerna run eslint',
            'clean': 'lerna run clean',
            'release:publish': 'lerna publish --conventional-commits',
            'release': 'pnpm build && pnpm release:publish',
        },
        'devDependencies': {
            '@eslint/js': '^10.0.1',
            '@foul11/awesome-eslint-config': '*',
            '@stylistic/eslint-plugin': '^5.10.0',
            '@stylistic/eslint-plugin-jsx': '^4.4.1',
            '@types/jest': '^30.0.0',
            '@types/node': '^25.6.0',
            'eslint': '^10.3.0',
            'eslint-import-resolver-typescript': '^4.4.4',
            'eslint-import-resolver-webpack': '^0.13.11',
            'eslint-plugin-compat': '^7.0.2',
            'eslint-plugin-import': '^2.32.0',
            'eslint-plugin-jest': '^29.15.2',
            'eslint-plugin-jsdoc': '^62.9.0',
            'eslint-plugin-react': '^7.37.5',
            'eslint-plugin-react-hooks': '^7.1.1',
            'eslint-plugin-unicorn': '^64.0.0',
            'eslint-plugin-workspaces': '^0.12.1',
            'globals': '^17.6.0',
            'lerna': '^9.0.7',
            'ts-jest': '^29.4.9',
            'typescript': '^6.0.3',
            'typescript-eslint': '^8.59.2',
        },
        'browserslist': [
            'defaults and fully supports es6-module',
            'maintained node versions',
        ],
        'packageManager': 'pnpm@12.8.2+sha512.a5941679663d952c5f0ecc38ba98af98b4dc01b95780354f6894f2f873973cef2f7e2989d7db3ee5393938ae21f62fe06bcdf685d475ddad829a62095d2b8b11',
    }, null, 2);
}

interface GetRootTsconfigBaseJsonOpts {
    
}

function get_root_tsconfig_base_json(opts: GetRootTsconfigBaseJsonOpts) {
    return JSON.stringify({
        'compilerOptions': {
            'target': 'ESNext',
            'module': 'ESNext',
            'moduleResolution': 'bundler',
            'declaration': true,
            'declarationMap': true,
            'sourceMap': true,
            'checkJs': true,
            'allowJs': true,
            'strict': true,
            'alwaysStrict': true,
            'skipLibCheck': true,
            'strictBindCallApply': true,
            'strictFunctionTypes': true,
            'exactOptionalPropertyTypes': true,
            'strictPropertyInitialization': true,
            'forceConsistentCasingInFileNames': true,
            'noImplicitAny': true,
            'noImplicitThis': true,
            'noImplicitReturns': true,
            'esModuleInterop': true,
            'types': [
                'jest',
                'node',
            ],
        },
    }, null, 4);
}

function get_root_pnpm_workspace_yaml() {
    return hd(`
        packages:
          - "packages/*"
    `);
}

function get_root_lerna_json() {
    return JSON.stringify({
        '$schema': 'node_modules/lerna/schemas/lerna-schema.json',
        'version': '1.2.2',
        'npmClient': 'pnpm',
        'command': {
            'publish': {
                'conventionalCommits': true,
                'message': 'chore(release): publish',
                'ignoreChanges': [
                    '**/*.md',
                    '**/*.test.ts',
                ],
            },
            'run': {
                'progress': true,
                'bail': false,
            },
        },
    }, null, 4);
}

function get_root_nx_json() {
    return JSON.stringify({
        'targetDefaults': {
            'test': {
                'cache': true,
                'dependsOn': [],
                'outputs': [
                    '{projectRoot}/coverage',
                ],
                },
            'build': {
                'cache': true,
                'dependsOn': [
                    '^build',
                ],
                'outputs': [
                    '{projectRoot}/dist',
                ],
                },
            'watch': {
                'dependsOn': [],
            },
            'eslint': {
                'cache': true,
                'dependsOn': [],
            },
            'clean': {
                'dependsOn': [],
            },
        },
    }, null, 4);
}

function get_root_gitignore() {
    return hd(`
        # Logs
        logs
        *.log
        npm-debug.log*
        yarn-debug.log*
        yarn-error.log*
        lerna-debug.log*
        
        # Diagnostic reports (https://nodejs.org/api/report.html)
        report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json
        
        # Runtime data
        pids
        *.pid
        *.seed
        *.pid.lock
        
        # Directory for instrumented libs generated by jscoverage/JSCover
        lib-cov
        
        # Coverage directory used by tools like istanbul
        coverage
        *.lcov
        
        # Compiled binary addons (https://nodejs.org/api/addons.html)
        build/Release
        
        # Dependency directories
        node_modules/
        jspm_packages/
        
        # Optional REPL history
        .node_repl_history
        
        # Output of 'npm pack'
        *.tgz
        
        # dotenv environment variable files
        .env
        .env.*
        !.env.example
        
        dist
        
        # pnpm
        .pnpm-store
        
        .nx/cache
        .nx/workspace-data
    `);
}

function create_monorepo(root: string) {
    console.log(`Creating monorepo in ${root}`);

    fs.mkdirSync(path.join(root, 'packages'));
    
    fs.writeFileSync(
        path.join(root, 'package.json'),
        get_root_package_json({
            name: path.basename(root),
            author: 'foul11',
        })
    );

    fs.writeFileSync(
        path.join(root, 'tsconfig.base.json'),
        get_root_tsconfig_base_json({
            root,
        })
    );
    
    fs.writeFileSync(
        path.join(root, 'pnpm-workspace.yaml'),
        get_root_pnpm_workspace_yaml()
    );
    
    fs.writeFileSync(
        path.join(root, 'eslint.config.js'),
        'export default [{}];'
    );
    
    fs.writeFileSync(
        path.join(root, 'lerna.json'),
        get_root_lerna_json()
    );
    
    fs.writeFileSync(
        path.join(root, 'nx.json'),
        get_root_nx_json()
    );
    
    fs.writeFileSync(
        path.join(root, '.gitignore'),
        get_root_gitignore()
    );
}

interface GetPackagePackageJsonOpts {
    name: string
    author: string
}

function get_package_package_json(opts: GetPackagePackageJsonOpts) {
    return JSON.stringify({
        'name': opts.name,
        'version': '1.0.0',
        'author': opts.author,
        'license': 'UNLICENSED',
        'keywords': [],
        'private': true,
        'type': 'module',
        'main': 'dist/index.mjs',
        'types': 'dist/index.d.ts',
        'scripts': {
            'test': 'jest',
            'build': 'awesome-tools webpack -t lib',
            'watch': 'awesome-tools webpack -t lib -w',
            'eslint': 'eslint . --max-warnings=0',
            'clean': 'rm -rf dist',
        },
        'dependencies': {
            
        },
        'devDependencies': {
            '@foul11/awesome-eslint-config': '*',
        },
        'jest': {
            'preset': 'ts-jest',
            'testEnvironment': 'node',
            'passWithNoTests': true,
        },
    }, null, 2);
}

function get_package_eslint_config_js() {
    return hd(`
        import baseConfig from '@foul11/awesome-eslint-config/base';
        import nodeConfig from '@foul11/awesome-eslint-config/node';
        
        export default [
            ...baseConfig,
            ...nodeConfig,
        ];
    `);
}

function get_package_tsconfig_build_json() {
    return JSON.stringify({
        'extends': './tsconfig.json',
        'compilerOptions': {
            'outDir': './dist',
            'rootDir': './src',
            'noEmit': false,
        },
        'include': [
            'src/**/*',
        ],
        'exclude': [
            'node_modules',
            'dist',
            'test/**/*',
            '**/*.test.ts',
        ],
    }, null, 4);
}

function get_package_tsconfig_json() {
    return JSON.stringify({
        'extends': '../../tsconfig.base.json',
        'compilerOptions': {
            'outDir': './dist',
            'rootDir': '.',
            'noEmit': true,
        },
        'include': [
            'src/**/*',
            'test/**/*',
        ],
        'exclude': [
            'node_modules',
            'dist',
        ],
    }, null, 4);
}

function create_package(root: string) {
    console.log(`Creating package in ${root}`);
    
    fs.mkdirSync(root);
    
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(
        path.join(root, 'src', 'index.ts'),
        hd(`
            export default {};
            
            console.log('Hello world!');
        `)
    );
    
    fs.writeFileSync(
        path.join(root, 'package.json'),
        get_package_package_json({
            name: path.basename(root),
            author: 'foul11',
        })
    );
    
    fs.writeFileSync(
        path.join(root, 'eslint.config.js'),
        get_package_eslint_config_js()
    );
    
    fs.writeFileSync(
        path.join(root, 'tsconfig.json'),
        get_package_tsconfig_json()
    );
    
    fs.writeFileSync(
        path.join(root, 'tsconfig.build.json'),
        get_package_tsconfig_build_json()
    );
}

function is_init_monorepo(root: string) {
    for (const file of [
        path.join(root, 'package.json'),
        path.join(root, 'tsconfig.base.json'),
        path.join(root, 'eslint.config.js'),
        path.join(root, 'lerna.json'),
        path.join(root, 'nx.json'),
        path.join(root, '.gitignore'),
    ]) {
        if (fs.existsSync(file)) {
            return true;
        }
    }
    
    return false;
}

function is_init_package(root: string, name: string) {
    for (const file of [
        path.join(root, 'packages', name),
    ]) {
        if (fs.existsSync(file)) {
            return true;
        }
    }
    
    return false;
}

function pnpm_install() {
    try {
        execSync('pnpm install --allow-build "@parcel/watcher" --allow-build "nx" --allow-build "unrs-resolver"');
    } catch (e) {
        console.error((e as Error).message);
        process.exit(1);
    }
}

function command_handler(options: CommandParams) {
    const root = findMonorepoRoot();
    
    if (!root) {
        console.error('Root of monorepo not found');
        process.exit(1);
    }
    
    if (!options.name) {
        if (is_init_monorepo(root)) {
            console.error('Monorepo already initialized');
            process.exit(1);
        }
        
        create_monorepo(root);
        pnpm_install();
        process.exit(0);
    }
    
    if (options.name) {
        if (!is_init_monorepo(root)) {
            create_monorepo(root);
            pnpm_install();
        }
        
        if (is_init_package(root, options.name)) {
            console.error(`Package '${options.name}' already exists`);
            process.exit(1);
        }
        
        create_package(path.join(root, 'packages', options.name));
        process.exit(0);
    }
}

export default command;
