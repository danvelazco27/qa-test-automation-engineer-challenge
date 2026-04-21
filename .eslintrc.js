/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },

  plugins: ['@typescript-eslint'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],

  rules: {
    /** Disallow `any` — use proper types or `unknown` */
    '@typescript-eslint/no-explicit-any': 'error',

    /** Require explicit return types on exported functions and class methods */
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowHigherOrderFunctions: true,
        allowTypedFunctionExpressions: true,
      },
    ],

    /** Prefer nullish coalescing over logical OR for default values */
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',

    /** No floating Promises — test assertions must be awaited */
    '@typescript-eslint/no-floating-promises': 'error',
  },

  env: {
    node: true,
    es2022: true,
  },

  overrides: [
    /**
     * Playwright-specific rules applied only to test spec files.
     * These rules enforce Playwright best practices and prevent common pitfalls
     * such as hardcoded waits, overly broad force-clicks, and non-web-first assertions.
     */
    {
      files: ['tests/**/*.spec.ts', 'tests/**/*.ts'],
      plugins: ['playwright'],
      extends: ['plugin:playwright/recommended'],
      rules: {
        /** Warn when force:true is used — should be documented with a comment */
        'playwright/no-force-option': 'warn',

        /** Disallow page.waitForTimeout() — use web-first assertions instead */
        'playwright/no-wait-for-timeout': 'error',

        /** Prefer web-first assertions (toBeVisible, toHaveText) over manual expects */
        'playwright/prefer-web-first-assertions': 'error',

        /** Disallow nested test.describe blocks beyond 1 level */
        'playwright/no-nested-step': 'warn',
      },
    },
  ],

  ignorePatterns: [
    'node_modules/',
    'dist/',
    'reports/',
    'test-results/',
    '*.js',
  ],
};
