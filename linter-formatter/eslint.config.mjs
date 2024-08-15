import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': 'error',
    },
    plugins: {
      prettier: prettierPlugin,
    },
  },
];
