import eslint from '@eslint/js';
import globals from 'globals';
import regexp from 'eslint-plugin-regexp';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      indent: ['error', 2],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'arrow-spacing': 'error',
      'keyword-spacing': 'error',
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always'
        }
      ]
    }
  },
  // The kit's own shipped code. `eslint src/` covered a two-file demo while
  // bin/ and utility/ — the files install-kit.sh copies into twelve repos — were
  // linted by nothing. A ReDoS in utility/set-version.mjs reached consumers and
  // was found by a consumer's CodeQL, not here.
  //
  // Plain JS, so the type-checked TypeScript rules do not apply; what matters is
  // regexp/no-super-linear-backtracking, which catches the class of defect that
  // got through.
  {
    files: ['bin/**/*.mjs', 'utility/**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    plugins: { regexp },
    rules: {
      ...regexp.configs['flat/recommended'].rules,
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/no-super-linear-move': 'error',
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  {
    ignores: ['dist/', 'node_modules/', 'tools/', 'eslint.config.mjs', 'packages/agent-kit/']
  }
);
