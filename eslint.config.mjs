// @ts-check
// NOTE: プラグインの命名は eslint-plugin を削ったlowerCamelCase

import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import * as importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['**/dist', '**/node_modules', '**/components/ui'],
  },

  // MARK: - Language config
  eslint.configs.recommended,
  tseslint.configs.strict,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    extends: [tseslint.configs.strictTypeChecked],
  },

  {
    files: ['packages/app/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      ...reactPlugin.configs.flat['jsx-runtime'].languageOptions,
      globals: globals.browser,
    },
    extends: [reactPlugin.configs.flat['jsx-runtime']],
  },

  {
    name: 'backend',
    files: ['packages/app/backend/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // MARK: - Plugins config

  // based on: https://typescript-eslint.io/getting-started/typed-linting
  {
    name: 'react plugin settings',
    settings: {
      react: {
        createClass: 'createReactClass',
        pragma: 'React',
        fragment: 'Fragment',
        version: 'detect',
        defaultVersion: '',
        flowVersion: '0.53',
      },
      propWrapperFunctions: [
        'forbidExtraProps',
        { property: 'freeze', object: 'Object' },
        { property: 'myFavoriteWrapper' },
        { property: 'forbidExtraProps', exact: true },
      ],
      componentWrapperFunctions: [
        'observer',
        { property: 'styled' },
        { property: 'observer', object: 'Mobx' },
        { property: 'observer', object: '<pragma>' },
      ],
      formComponents: [
        'CustomForm',
        { name: 'SimpleForm', formAttribute: 'endpoint' },
        { name: 'Form', formAttribute: ['registerEndpoint', 'loginEndpoint'] },
      ],
      linkComponents: [
        'Hyperlink',
        { name: 'MyLink', linkAttribute: 'to' },
        { name: 'Link', linkAttribute: ['to', 'href'] },
      ],
    },
  },

  {
    name: 'import rules',
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unused-import': unusedImportsPlugin,
    },
    rules: {
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/consistent-type-specifier-style': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-import/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-import/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // MARK: - Additional rules

  {
    name: 'frontend rules',
    files: ['packages/app/frontend/**/*.{ts,tsx}'],
    plugins: { react: reactPlugin },
    rules: {
      'no-console': 'warn',
      'no-restricted-imports': 'off',
      'react/hook-use-state': 'error',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@routes'],
              message: 'Do not use backend types.',
              allowTypeImports: true,
            },
          ],
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            // NOTE: イベントハンドラ内で非同期処理をしたいことがある
            attributes: false,
          },
        },
      ],
    },
  },

  {
    name: 'backend rules',
    files: ['packages/app/backend/**/*.ts'],
    rules: {
      // there is no rules yet
    },
  },

  {
    name: 'common rules',
    files: ['**/*.{ts,tsx}'],
    rules: {
      eqeqeq: ['error', 'always'],
      'no-useless-rename': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: {
      // NOTE: 同一構造のinterfaceを別名で定義したいことがある
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // MARK: - Architecture rules

  {
    name: 'Avoid direct import of external package',
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dayjs',
              message: 'Use @frontend/lib/date or @backend/lib/date instead',
            },
            {
              name: '@routes',
              message: 'frontend must not depends on backend types',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Use src/lib/client',
        },
        {
          name: 'Date',
          message: 'Use @frontend/lib/date or @backend/lib/date instead',
        },
      ],
    },
  },

  prettierConfig,
)
