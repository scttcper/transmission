import config from '@ctrl/eslint-config-biome';

export default [
  {
    ignores: ['eslint.config.mjs', 'vite.config.ts', 'dist', 'coverage', 'build', 'docs'],
  },
  ...config,
  {
    rules: {
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
    },
  },
];
