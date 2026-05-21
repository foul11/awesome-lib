import { defineConfig } from 'eslint/config';
import { tseslint_files } from './config';

import plugin_unicorn from 'eslint-plugin-unicorn';
import plugin_stylistic from '@stylistic/eslint-plugin';

import globals from 'globals';

export default defineConfig([
    {
        name: '@foul11/awesome-eslint-config/node:typescript',
        files: tseslint_files,
        rules: {
            '@typescript-eslint/await-thenable': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/require-await': 'off',
        },
    },
    {
        name: '@foul11/awesome-eslint-config/node:all',
        plugins: {
            'unicorn': plugin_unicorn,
            '@stylistic': plugin_stylistic,
        },
        
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        
        rules: {
            'no-inner-declarations': 'off',
            
            'unicorn/no-process-exit': 'off',
            
            '@stylistic/space-in-parens': 'off',
            '@stylistic/template-tag-spacing': 'off',
            '@stylistic/no-whitespace-before-property': 'off',
            '@stylistic/indent': 'off',
        },
    },
]);