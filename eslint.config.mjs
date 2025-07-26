import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginReact from 'eslint-plugin-react';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  globalIgnores(['.millennium/', '.venv/', '._extensions/', 'webkit/chromeInjectionContent.js']),
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*config.mjs', 'helpers/clean-maps.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    settings: {
      react: {
        version: '16.14',
      },
    },
  },
  pluginJs.configs.all,
  ...tseslint.configs.all,
  pluginReact.configs.flat.all,
  stylistic.configs.all,
  stylistic.configs['disable-legacy'],
  stylistic.configs.customize({
    indent: 2,
    semi: true,
    quotes: 'single',
    braceStyle: '1tbs',
    blockSpacing: true,
    commaDangle: 'always-multiline',
  }),
  {
    plugins: {

      perfectionist,
    },
    rules: {
      // #region Formatting preferences
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/member-delimiter-style': ['error', { singleline: { requireLast: true } }],
      '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: ['return', 'function', 'class', 'interface', 'type', 'enum'] },
      ],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      curly: ['error', 'multi-line'],
      'perfectionist/sort-interfaces': ['error', { type: 'natural', groups: ['method', 'property'] }],

      '@stylistic/array-element-newline': 'off',
      '@stylistic/implicit-arrow-linebreak': 'off',
      '@stylistic/lines-around-comment': 'off',
      '@stylistic/multiline-comment-style': 'off',
      '@stylistic/object-property-newline': 'off',
      // #endregion

      // #region Preferences
      '@typescript-eslint/method-signature-style': ['error', 'method'],
      '@typescript-eslint/prefer-literal-enum-member': ['error', { allowBitwiseExpressions: true }],
      'func-style': ['error', 'declaration'],
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }], // Higher than default for React components

      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/parameter-properties': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/prefer-enum-initializers': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/prefer-regexp-exec': 'off',
      'capitalized-comments': 'off',
      'guard-for-in': 'off',
      'id-length': 'off',
      'max-lines': 'off',
      'max-statements': 'off',
      'new-cap': 'off',
      'no-bitwise': 'off',
      'no-continue': 'off',
      'no-inline-comments': 'off',
      'no-negated-condition': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-ternary': 'off',
      'no-undefined': 'off',
      'no-warning-comments': 'off',
      'one-var': 'off',
      'prefer-named-capture-group': 'off',
      radix: 'off',
      'require-unicode-regexp': 'off',
      'sort-imports': 'off',
      'sort-keys': 'off',
      // #endregion

      // #region Project specific
      '@typescript-eslint/member-ordering': ['error', { interfaces: ['method', 'field'] }],

      'arrow-body-style': ['off'],
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-console': 'off',
      'no-alert': 'off',
      camelcase: 'off',
      // #endregion

      // #region React
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],

      '@stylistic/jsx-one-expression-per-line': 'off',
      'react/forbid-component-props': 'off',
      'react/jsx-max-depth': 'off',
      'react/jsx-no-literals': 'off',
      'react/jsx-no-bind': 'off',
      'react/require-default-props': 'off',
      'react/jsx-no-leaked-render': 'off',
      // #endregion
    },
  },
);
