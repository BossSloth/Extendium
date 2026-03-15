import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['frontend/index.tsx'],
  project: ['frontend/**/*.{ts,tsx}'],
};

export default config;
