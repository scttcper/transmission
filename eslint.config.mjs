import config from '@ctrl/eslint-config-biome';

export default [
  {
    ignores: ['eslint.config.mjs', 'vite.config.ts', 'dist', 'coverage', 'build', 'docs'],
  },
  ...config,
];
