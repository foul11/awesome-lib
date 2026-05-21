import type { RulesConfig } from '@eslint/core';
import type { Linter } from 'eslint';

export function allRulesToWarn<
    T extends Linter.Config<RulesConfig>,
>(plugin: T): T {
    if (!plugin.rules)
        return plugin;
    
    const rules_warn = Object.fromEntries(
        Object.entries(plugin.rules)
            .map((rule) => {
                if (rule[1] === 'error')
                    return [ rule[0], 'warn' ];
                
                if (Array.isArray(rule[1]) && rule[1][0] === 'error')
                    return [ rule[0], [ 'warn', ...rule[1].slice(1) ]];
                
                return [ rule[0], rule[1] ];
            }),
    );
    
    return {
        ...plugin,
        rules: rules_warn,
    };
}

export const eslint_files = [
    'eslint.config.js',
];

export const tests_files = [
    '**/*.spec.{js,ts,jsx,tsx,cjs,mjs,cts,mts}',
    '**/*.test.{js,ts,jsx,tsx,cjs,mjs,cts,mts}',
];

export const types_files = [
    '**/types/**/*.{d.ts,ts}',
];

export const tseslint_files = [
    'src/**/*.{js,ts,jsx,tsx,cjs,mjs,cts,mts}',
    'test/**/*.{js,ts,jsx,tsx,cjs,mjs,cts,mts}',
];

export const global_ignores = [
    '**/node_modules',
    // '**/packages',
    '**/dist',
];