import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import pluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';

// ESLint v9+ flat config
export default [
    // Ignored files and folders (replacement for .eslintignore)
    {
        ignores: [
            'node_modules',
            '.next',
            'out',
            'dist',
            'build',
            'coverage',
            'public',
            '.*',
            'monorepo',
            'scripts',
            '**/__fixtures__/**',
            '**/__tests__/**',
            '**/*.{test,spec}.{js,jsx,ts,tsx}',
            '**/*.min.js',
        ],
    },

    // Base JS recommended rules with global environments for browser and node
    {
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },

    // TypeScript-specific rules
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                // Enable the next line for type-aware linting (can be slower). Comment out if performance is an issue.
                // project: './tsconfig.json',
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: pluginPrettier,
        },
        rules: {
            // Keep Prettier formatting surfaced via ESLint (non-blocking)
            'prettier/prettier': 'warn',
            // Defer unused-vars to TypeScript rule and relax in TS files
            'no-unused-vars': 'off',
            // Base no-undef and no-redeclare are not reliable in TS parsing without type info
            'no-undef': 'off',
            'no-redeclare': 'off',
            // Allow intentionally unused variables prefixed with _
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },

    // Loosen rules for type definition files
    {
        files: ['**/*.d.ts'],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
];
