import fs, { existsSync } from 'node:fs';
import path from 'node:path';

import { glob } from 'glob';
import { findUp } from 'find-up';
import { defineCommand, type InferCommandArgs } from '../utils';
import type { CompilerOptions } from 'typescript';

interface TsConfig {
    extends: string
    compilerOptions: CompilerOptions
    include?: string[]
    exclude?: string[]
    references?: { path: string }[]
}

export type GenerateTsconfigParams = InferCommandArgs<typeof command>;

const command = defineCommand({
    command: 'generate-tsconfig',
    describe: 'Generate tsconfig.*.json files for all packages in monorepo',
    builder: async yargs => yargs
        .option('root', {
            alias: 'r',
            type: 'string',
            demandOption: true,
            description: 'Root of monorepo',
            default: await findUp(async (dir) => {
                if (existsSync(path.join(dir, 'pnpm-workspace.yaml')))
                    return dir;
                
                if (existsSync(path.join(dir, '.git')))
                    return dir;
                
                return undefined;
            }, { cwd: process.cwd(), type: 'directory' }),
        })
        .option('ts-base', {
            type: 'string',
            demandOption: true,
            default: 'tsconfig.base.json',
        }),
    handler: command_generateTsConfigs as any,
});

function writeJson(filePath: string, content: object) {
    const str = JSON.stringify(content, null, 4);
    fs.writeFileSync(filePath, str, 'utf8');
}

async function command_generateTsConfigs(options: GenerateTsconfigParams) {
    const packagesDir = path.join(options.root, 'packages');
    
    const baseTemplate: TsConfig = {
        extends: `../../${options.tsBase}`,
        compilerOptions: {
            outDir: './dist',
            rootDir: '.',
            noEmit: true,
        },
        include: [ 'src/**/*', 'test/**/*' ],
        exclude: [ 'node_modules', 'dist' ],
    };
    
    const buildTemplate: TsConfig = {
        extends: './tsconfig.json',
        compilerOptions: {
            outDir: './dist',
            rootDir: './src',
            noEmit: false,
        },
        include: [ 'src/**/*' ],
        exclude: [ 'node_modules', 'dist', 'test/**/*', '**/*.test.ts' ],
    };
    
    if (!fs.existsSync(packagesDir)) {
        console.error(`Папка packages не найдена по пути ${packagesDir}`);
        process.exit(1);
    }
    
    const packagePaths = await glob('*/package.json', { cwd: packagesDir, absolute: true });
    
    for (const pkgPath of packagePaths) {
        const pkgDir = path.dirname(pkgPath);
        
        const baseConfigPath = path.join(pkgDir, 'tsconfig.json');
        const buildConfigPath = path.join(pkgDir, 'tsconfig.build.json');
        
        writeJson(baseConfigPath, baseTemplate);
        writeJson(buildConfigPath, buildTemplate);
        
        console.log(`✅ tsconfig.json создан для ${path.basename(pkgDir)}`);
    }
    
    console.log('Генерация завершена.');
}

export default command;