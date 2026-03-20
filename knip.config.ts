import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['webkit/index.tsx'],
  project: ['{frontend,webkit,shared}/**/*.{ts,tsx}'],
};

export default config;
