import pluginReact from '@eslint-react/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'oxlint';

export default defineConfig({
  // React uses the JS plugin's all preset below, not a second native React ruleset.
  plugins: ['typescript'],
  jsPlugins: ['@eslint-react/eslint-plugin', '@stylistic/eslint-plugin', 'eslint-plugin-perfectionist'],
  ignorePatterns: ['.millennium/**', '.venv/**', '.extensions*/**', 'webkit/chromeInjectionContent.js', 'helpers/**'],
  options: {
    typeAware: true,
  },
  env: {
    browser: true,
  },
  settings: {
    'react-x': {
      version: '19.2',
    },
  },
  categories: {
    correctness: 'error',
    suspicious: 'error',
    pedantic: 'error',
    perf: 'error',
    style: 'error',
    restriction: 'error',
    nursery: 'error',
  },
  rules: {
    ...pluginReact.configs.all.rules,
    ...stylistic.configs.all.rules,
    ...stylistic.configs.customize({
      indent: 2,
      semi: true,
      quotes: 'single',
      braceStyle: '1tbs',
      blockSpacing: true,
      commaDangle: 'always-multiline',
    }).rules,

    // TODO: Remove this when all deprecated code is removed
    'typescript/no-deprecated': 'warn',

    // #region Formatting preferences
    '@stylistic/function-call-argument-newline': ['error', 'consistent'],
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
    '@stylistic/function-paren-newline': 'off',
    '@stylistic/arrow-parens': 'off',
    '@stylistic/indent': 'off',
    '@stylistic/wrap-regex': 'off',
    '@stylistic/operator-linebreak': 'off',
    '@stylistic/multiline-ternary': 'off',
    '@stylistic/jsx-wrap-multilines': 'off',
    // #endregion

    // #region Preferences
    'typescript/method-signature-style': ['error', 'method'],
    'typescript/prefer-literal-enum-member': ['error', { allowBitwiseExpressions: true }],
    'func-style': ['error', 'declaration'],
    'max-lines-per-function': 'off',

    'typescript/consistent-type-exports': 'off',
    'typescript/consistent-type-imports': 'off',
    'typescript/explicit-member-accessibility': 'off',
    'typescript/max-params': 'off',
    'typescript/no-invalid-void-type': 'off',
    'typescript/no-misused-promises': 'off',
    'typescript/no-unsafe-type-assertion': 'off',
    'typescript/no-use-before-define': 'off',
    'typescript/parameter-properties': 'off',
    'typescript/prefer-enum-initializers': 'off',
    'typescript/prefer-readonly-parameter-types': 'off',
    'typescript/prefer-regexp-exec': 'off',
    'capitalized-comments': 'off',
    'guard-for-in': 'off',
    'id-length': 'off',
    'init-declarations': 'off',
    'max-lines': 'off',
    'max-statements': 'off',
    'new-cap': 'off',
    'no-bitwise': 'off',
    'no-continue': 'off',
    'no-inline-comments': 'off',
    'no-magic-numbers': 'off',
    'no-negated-condition': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-ternary': 'off',
    'no-undefined': 'off',
    'no-warning-comments': 'off',
    'one-var': 'off',
    'prefer-destructuring': 'off',
    'prefer-named-capture-group': 'off',
    radix: 'off',
    'require-unicode-regexp': 'off',
    'sort-imports': 'off',
    'sort-keys': 'off',
    // #endregion

    // #region Project specific
    'arrow-body-style': 'off',
    'typescript/unbound-method': 'off',
    'typescript/no-floating-promises': 'off',
    'no-console': 'off',
    'no-alert': 'off',
    'typescript/strict-void-return': 'off',
    // #endregion

    // #region React
    '@stylistic/jsx-one-expression-per-line': 'off',
    // #endregion

    // #region TypeScript compatibility
    // Use the type-aware rule instead of its syntax-only core equivalent.
    'require-await': 'off',
    // Superseded by no-empty-object-type, no-unsafe-function-type, and no-wrapper-object-types.
    'typescript/ban-types': 'off',
    // #endregion
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx,mts,cts}'],
      rules: {
        // These checks are handled by the TypeScript compiler.
        'constructor-super': 'off',
        'getter-return': 'off',
        'no-class-assign': 'off',
        'no-const-assign': 'off',
        'no-dupe-keys': 'off',
        'no-func-assign': 'off',
        'no-import-assign': 'off',
        'no-new-native-nonconstructor': 'off',
        'no-obj-calls': 'off',
        'no-setter-return': 'off',
        'no-this-before-super': 'off',
        'no-undef': 'off',
        'no-unreachable': 'off',
        'no-unsafe-negation': 'off',
        'no-with': 'off',
      },
    },
    {
      files: ['fake-header-extension/**/*.js'],
      rules: {
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/ban-ts-comment': 'off',
      },
    },
  ],
});
