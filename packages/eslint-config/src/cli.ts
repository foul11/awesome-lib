import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        name: '@foul11/awesome-eslint-config/cli:all',
        rules: {
            'no-process-exit': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
        },
    },
]);