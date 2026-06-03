import { defineConfig, globalIgnores } from 'eslint/config';
import { global_ignores, tseslint_files, allRulesToWarn, types_files, eslint_files, tests_files } from './config';

import * as plugin_import from 'eslint-plugin-import';
import plugin_unicorn from 'eslint-plugin-unicorn';
import plugin_jsdoc from 'eslint-plugin-jsdoc';
import plugin_stylistic from '@stylistic/eslint-plugin';
import plugin_compat from 'eslint-plugin-compat';
import plugin_workspaces from 'eslint-plugin-workspaces';
import plugin_jest from 'eslint-plugin-jest';

import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default defineConfig([
    globalIgnores(global_ignores),
    allRulesToWarn(js.configs.recommended),
    tseslint.configs.recommended.map(config => ({
        ...config,
        files: tseslint_files,
        languageOptions: {
            parser: tseslint.parser,
            
            ecmaVersion: 2015,
            sourceType: 'module',
            
            parserOptions: {
                projectService: true,
                requireConfigFile: false,
            },
        },
        
        rules: {
            ...config.rules,
            
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/consistent-type-imports': 'warn',
            '@typescript-eslint/no-floating-promises': [ 'error', {}],
            
            '@typescript-eslint/no-unsafe-member-access': 0,
            '@typescript-eslint/no-unsafe-assignment': 0,
            // '@typescript-eslint/no-unsafe-argument': 0,
            // '@typescript-eslint/no-unsafe-return': 0,
            '@typescript-eslint/no-explicit-any': 0,
            // '@typescript-eslint/no-unsafe-call': 0,
            // '@typescript-eslint/unbound-method': 0,
            '@typescript-eslint/no-empty-object-type': 0,
            
            '@typescript-eslint/consistent-return': 'warn',
            '@typescript-eslint/default-param-last': 'warn',
            '@typescript-eslint/dot-notation': 'warn',
            '@typescript-eslint/no-array-constructor': 'warn',
            '@typescript-eslint/no-dupe-class-members': 'warn',
            '@typescript-eslint/no-empty-function': 0,
            '@typescript-eslint/no-implied-eval': 'warn',
            '@typescript-eslint/no-invalid-this': 'warn',
            '@typescript-eslint/no-loop-func': 'warn',
            '@typescript-eslint/no-redeclare': 'warn',
            '@typescript-eslint/no-restricted-imports': 'warn',
            '@typescript-eslint/no-shadow': 'warn',
            '@typescript-eslint/no-unused-expressions': 'warn',
            
            '@typescript-eslint/no-unused-vars': [ 'warn', {
                'argsIgnorePattern': '^(?:next|bot|ctx|err)$',
            }],
            
            '@typescript-eslint/no-use-before-define': 'warn',
            '@typescript-eslint/no-useless-constructor': 'warn',
            '@typescript-eslint/only-throw-error': 'warn',
            '@typescript-eslint/prefer-promise-reject-errors': 'warn',
            '@typescript-eslint/require-await': 'warn',
        },
    })),
    allRulesToWarn({
        ...plugin_unicorn.configs.recommended,
        rules: {
            ...plugin_unicorn.configs.recommended.rules,
            
            'unicorn/no-useless-promise-resolve-reject': 'off',
            'unicorn/prefer-optional-catch-binding': 'off',
            'unicorn/consistent-function-scoping': 'off',
            'unicorn/no-anonymous-default-export': 'off',
            'unicorn/no-await-expression-member': 'off',
            'unicorn/prefer-string-replace-all': 'off',
            'unicorn/numeric-separators-style': 'off',
            'unicorn/prefer-number-properties': 'off',
            'unicorn/no-useless-switch-case': 'off',
            'unicorn/prefer-top-level-await': 'off',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/explicit-length-check': 'off',
            'unicorn/prefer-node-protocol': 'off',
            'unicorn/no-useless-undefined': 'off',
            'unicorn/no-negated-condition': 'off',
            'unicorn/no-static-only-class': 'off',
            'unicorn/number-literal-case': 'off',
            'unicorn/prefer-event-target': 'off',
            'unicorn/no-typeof-undefined': 'off',
            'unicorn/prefer-export-from': 'off',
            'unicorn/empty-brace-spaces': 'off',
            'unicorn/switch-case-braces': 'off',
            'unicorn/no-zero-fractions': 'off',
            'unicorn/prefer-string-raw': 'off',
            'unicorn/no-array-for-each': 'off',
            'unicorn/prefer-math-trunc': 'off',
            'unicorn/prefer-code-point': 'off',
            'unicorn/catch-error-name': 'off',
            'unicorn/template-indent': 'off',
            'unicorn/no-array-reduce': 'off',
            'unicorn/prefer-ternary': 'off',
            'unicorn/no-hex-escape': 'off',
            'unicorn/prefer-module': 'off',
            'unicorn/prefer-spread': 'off',
            'unicorn/filename-case': 'off',
            'unicorn/no-empty-file': 'off',
            'unicorn/import-style': 'off',
            'unicorn/prefer-at': 'off',
            'unicorn/no-null': 'off',
        },
    }),
    allRulesToWarn(plugin_compat.configs['flat/recommended']),
    plugin_jsdoc.configs['flat/recommended'],
    plugin_workspaces.configs.recommended,
    plugin_import.flatConfigs.recommended,
    {
        name: '@stylistic/warn',
        ...plugin_stylistic.configs.customize({
            severity: 'warn',
            indent: 4,
        }),
    },
    {
        name: '@foul11/awesome-eslint-config/base:eslintrc',
        files: eslint_files,
        rules: {
            'workspaces/no-absolute-imports': 'off',
        },
    },
    {
        name: '@foul11/awesome-eslint-config/base:jest',
        files: tests_files,
        plugins: { jest: plugin_jest },
        languageOptions: {
            globals: plugin_jest.environments.globals.globals,
        },
        rules: {
            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/prefer-to-have-length': 'warn',
            'jest/valid-expect': 'error',
        },
    },
    {
        name: '@foul11/awesome-eslint-config/base:all',
        settings: {
            'import/resolver': {
                typescript: {
                    project: './tsconfig.json',
                    alwaysTryTypes: true,
                },
            },
        },
        rules: {
            'no-object-constructor': 'warn',
            'no-inner-declarations': 1,
            'no-extend-native': 1,
            'no-return-assign': 1,
            'no-new-wrappers': 1,
            'no-octal-escape': 1,
            'no-script-url': 1,
            'no-undef-init': 1,
            'no-extra-bind': 1,
            'no-label-var': 1,
            'no-sequences': 1,
            'no-iterator': 1,
            'no-new-func': 1,
            'no-caller': 1,
            'no-labels': 1,
            'no-proto': 1,
            'no-alert': 1,
            'no-eval': 1,
            'no-new': 1,
            'yoda': 1,
            
            'space-after-function-name': 0,
            'max-nested-callbacks': 0,
            'space-after-keywords': 0,
            'spaced-line-comment': 0,
            'no-warning-comments': 0,
            'operator-assignment': 0,
            'no-inline-comments': 0,
            'space-in-brackets': 0,
            'block-scoped-var': 0,
            'no-self-compare': 0,
            'consistent-this': 0,
            'generator-star': 0,
            'max-statements': 0,
            'no-else-return': 0,
            'global-strict': 0,
            'default-case': 0,
            'guard-for-in': 0,
            'no-div-regex': 0,
            'no-undefined': 0,
            'no-multi-str': 0,
            'no-lonely-if': 0,
            'vars-on-top': 0,
            'no-plusplus': 0,
            'func-names': 0,
            'no-eq-null': 0,
            'func-style': 0,
            'no-ternary': 0,
            'complexity': 0,
            'no-bitwise': 0,
            'max-depth': 0,
            'sort-vars': 0,
            'no-void': 0,
            'one-var': 0,
            'radix': 0,
            
            'no-empty': 0,
            'no-empty-pattern': 0,
            'no-useless-escape': 0,
            
            'no-var': 'warn',
            'prefer-const': 'warn',
            
            'new-cap': [ 'warn', {
                'capIsNewExceptionPattern': '(Expect|express|Object)[\\._](\\w+\\.?)+',
            }],
            
            'import/no-named-as-default-member': 'off',
            
            'jsdoc/require-returns-description': 'off',
            'jsdoc/require-property-description': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/no-undefined-types': 'off',
            'jsdoc/require-returns': 'off',
            'jsdoc/check-tag-names': 'off',
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/valid-types': 'off',
            'jsdoc/tag-lines': 'off',
            
            'jsdoc/check-param-names': [ 'warn', {
                'disableMissingParamChecks': true,
            }],
            
            '@stylistic/indent': [ 'warn', 4, {
                'ignoreComments': true,
                'SwitchCase': 1,
            }],
            
            '@stylistic/no-multiple-empty-lines': [ 'warn', {
                'max': 2,
                'maxEOF': 1,
                'maxBOF': 0,
            }],
                        
            '@stylistic/no-trailing-spaces': [ 'warn', {
                'skipBlankLines': true,
                'ignoreComments': true,
            }],
            
            '@stylistic/semi': [ 'warn', 'always' ],
            '@stylistic/linebreak-style': [ 'error', 'unix' ],
            
            '@stylistic/brace-style': [ 'warn', '1tbs', {
                'allowSingleLine': true,
            }],
            
            '@stylistic/operator-linebreak': [ 'warn', 'before', {
                'overrides': {
                    '||': 'after',
                    '&&': 'after',
                    '=': 'after',
                },
            }],
            
            '@stylistic/array-bracket-spacing': [ 'warn', 'always', {
                'singleValue': true,
                'objectsInArrays': false,
                'arraysInArrays': false,
            }],
            
            '@stylistic/max-statements-per-line': [ 'warn', {
                'max': 2,
            }],
            
            '@stylistic/comma-dangle': [ 'warn', {
                'functions': 'ignore',
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'dynamicImports': 'always-multiline',
                'importAttributes': 'always-multiline',
                'enums': 'always-multiline',
                'generics': 'always-multiline',
                'tuples': 'always-multiline',
            }],
            
            '@stylistic/quotes': [ 'warn', 'single', {
                'allowTemplateLiterals': 'always',
                'avoidEscape': true,
            }],
            
            '@stylistic/multiline-ternary': 'off',
            '@stylistic/no-extra-parens': 'off',
            '@stylistic/no-multi-spaces': 'off',
            '@stylistic/quote-props': 'off',
            '@stylistic/key-spacing': 'off',
            '@stylistic/eol-last': 'off',
            '@stylistic/arrow-parens': 'warn',
            
            '@stylistic/function-call-spacing': 'warn',
            '@stylistic/space-infix-ops': 'warn',
            '@stylistic/keyword-spacing': 'warn',
            '@stylistic/comma-spacing': 'warn',
            '@stylistic/new-parens': 'warn',
            '@stylistic/no-extra-semi': 'warn',
            '@stylistic/no-mixed-spaces-and-tabs': 'warn',
            '@stylistic/semi-spacing': 'warn',
        },
    },
]);