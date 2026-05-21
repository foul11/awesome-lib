import { defineConfig } from 'eslint/config';
import { tseslint_files } from './config';

import plugin_react from 'eslint-plugin-react';
import plugin_react_hooks from 'eslint-plugin-react-hooks';
import plugin_unicorn from 'eslint-plugin-unicorn';
import plugin_stylistic from '@stylistic/eslint-plugin';

import globals from 'globals';

export default defineConfig([
    plugin_react_hooks.configs.flat['recommended-latest'],
    {
        name: '@foul11/awesome-eslint-config/react:typescript',
        files: tseslint_files,
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/require-await': 'off',
        },
    },
    {
        name: '@foul11/awesome-eslint-config/react:all',
        plugins: {
            'react': plugin_react,
            'unicorn': plugin_unicorn,
            '@stylistic': plugin_stylistic,
        },
        
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },

        // settings: {
        //     react: {
        //         version: '18.2.0', // FIXME: Update react version to 19
        //     },
        // },

        rules: {
            '@stylistic/jsx-tag-spacing': 'warn',
            '@stylistic/jsx-indent-props': [ 'warn', 4 ],

            '@stylistic/jsx-curly-spacing': [ 'warn', {
                'when': 'never',
            }],

            '@stylistic/jsx-max-props-per-line': [ 'warn', {
                'when': 'multiline',
            }],

            '@stylistic/jsx-first-prop-new-line': [ 'warn', 'multiline' ],
            '@stylistic/jsx-closing-tag-location': [ 'warn', 'line-aligned' ],
            '@stylistic/jsx-closing-bracket-location': [ 'warn', 'line-aligned' ],
            '@stylistic/jsx-function-call-newline': [ 'warn', 'multiline' ],
            '@stylistic/jsx-quotes': [ 'warn', 'prefer-single' ],

            '@stylistic/jsx-curly-newline': [ 'warn', {
                'multiline': 'consistent',
                'singleline': 'consistent',
            }],

            '@stylistic/jsx-one-expression-per-line': [ 'off' ],

            '@stylistic/jsx-wrap-multilines': [ 'warn', {
                'declaration': false,
                'assignment': false,
                'return': false,
                'arrow': 'parens',
                'condition': 'parens-new-line',
                'logical': 'parens-new-line',
                'prop': 'parens-new-line',
                'propertyValue': false,
            }],

            '@stylistic/jsx-curly-brace-presence': [ 'warn', {
                'props': 'always',
                'children': 'always',
            }],

            'react/jsx-boolean-value': 1,
            'react/jsx-no-undef': 1,
            'react/jsx-uses-react': 1,
            'react/jsx-uses-vars': 1,
            'react/no-did-mount-set-state': 1,
            'react/no-did-update-set-state': 1,
            'react/no-multi-comp': 0,
            'react/no-unknown-property': 1,
            'react/react-in-jsx-scope': 1,
            'react/self-closing-comp': 1,
            
            'camelcase': 1,
            'no-underscore-dangle': 1,
            'lines-between-class-members': 'off',

            'no-restricted-syntax': [ 'error', {
                'selector': 'TSTypeReference[typeName.name="SxProps"]:not([typeParameters])',
                'message': 'SxProps must have Theme parameter to avoid significant compiler slowdown.',
            }, {
                'selector': 'TSTypeReference[typeName.name="Components"]:not([typeParameters])',
                'message': 'Components must have Theme parameter to avoid significant compiler slowdown.',
            }],

            'no-restricted-imports': [ 'error', {
                'paths': [{
                    'name': '@mui/system',
                    'message': 'Please use import it from @mui/material instead.',
                }],
            }],
        },
    },
]);