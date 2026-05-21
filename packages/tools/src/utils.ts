import path from 'node:path';
import { existsSync, readFileSync, statfsSync } from 'node:fs';

import ts from 'typescript';
import isPathInside from 'is-path-inside';
import { exports as resolveExports } from 'resolve.exports';

import type { CommandModule, ArgumentsCamelCase } from 'yargs';

export type InferCommandArgs<
    Input extends CommandModule<unknown, unknown>,
> = Input extends CommandModule<unknown, infer U>
    ? ArgumentsCamelCase<U>
    : never;

export function defineCommand<
    Args,
    Ret,
    Input extends CommandModule<Args, Ret>,
>(input: Input) {
    return input;
}

export function isTrue(value: string | undefined, def = false) {
    return value ? /^t(rue)?$/i.test(value.trim()) : def;
}

export function isDev(value: string | undefined, def = false) {
    return value ? /^d(ev)?/i.test(value.trim()) : def;
}

export function findTsConfig(dir: string) {
    return [
        path.join(dir, 'tsconfig.build.json'),
        path.join(dir, 'tsconfig.json'),
    ].find(tsConfigPath => existsSync(tsConfigPath));
}

export function readTsConfig(filename: string) {
    const { config, error } = ts.readConfigFile(filename, ts.sys.readFile);
    
    if (error) {
        throw new Error(ts.formatDiagnostic(error, ts.createCompilerHost({})));
    }
    
    return ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        path.dirname(filename),
        undefined,
        filename,
    );
}

export function readPackageJson(filename: string) {
    return JSON.parse(readFileSync(filename, 'utf8'));
}

export function webpackFileEntries(pkgPath: string, entries: string[] | undefined, options: {
    buildDir: string
    sourceDir: string
}) {
    let entryFiles: [string, string][] = [];
    
    const pkg = readPackageJson(pkgPath);
    const resolveEntryFile = (filename: string) => {
        if (isPathInside(filename, options.buildDir)) {
            filename = path.relative(options.buildDir, filename);
            filename = path.join(options.sourceDir, filename);
        }
        
        return filename.replace(/\.[cm]?[jt]sx?$/,
            [ '.ts', '.js', '.tsx', '.jsx' ]
                .find((ext) => {
                    try {
                        statfsSync(filename.replace(/\.[cm]?[jt]sx?$/, ext));
                    } catch {
                        return false;
                    }
                    
                    return true;
                }) || '.ts',
        );
    };
    
    if (!entries || entries.length <= 1) {
        if (pkg.exports) {
            entryFiles = Object.entries(pkg.exports)
                .map(([ importKey ]) => {
                    const resolvedExport = resolveExports(pkg, importKey)?.[0];
                    
                    if (!resolvedExport)
                        throw new Error(`Can't resolve export ${importKey}`);
                    
                    return [
                        importKey === '.'
                            ? 'index'
                            : importKey,
                        resolveEntryFile(resolvedExport),
                    ];
                });
        }
        
        const entryPath = pkg.main || pkg.module || entries?.[0];
        
        if (!entryPath && !entryFiles.length) {
            throw new Error('No entry file found');
        }
        
        if (entryPath) {
            entryFiles.push([
                path.basename(entryPath, path.extname(entryPath)),
                resolveEntryFile(entryPath),
            ]);
        }
    } else {
        entryFiles = entries
            .map(entry => [
                path.basename(entry, path.extname(entry)),
                resolveEntryFile(entry),
            ]);
    }
    
    entryFiles = entryFiles
        .filter(entry => isPathInside(entry[1], options.sourceDir));
    
    return Object.fromEntries(
        entryFiles.map(entry => [
            entry[0]
                .replace(/^\.\//, '')
                .replace(/\.[cm]?[jt]sx?$/, ''),
            entry[1],
        ]),
    );
}