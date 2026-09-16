import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist/**',
    '.astro/**',
    'public/**',
    'content/**',
    'node_modules/**',
    'test-results/**',
    'playwright-report/**',
    '.husky/**',
  ]),
  {
    files: ['**/*.{js,mjs,ts}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.ts'],
    extends: [ts.configs.recommendedTypeChecked, ts.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/scripts/**/*.ts', 'src/components/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: ts.parser } },
    rules: { 'astro/no-unused-css-selector': 'error' },
  },
  prettier,
);
