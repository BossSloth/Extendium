/* eslint-disable no-template-curly-in-string */
/**
 * @type {import('semantic-release').Options}
 */
export default {
  tagFormat: 'v${version}',
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'RELEASE_VERSION=${nextRelease.version} bun run helpers/update-version.ts',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'plugin.json', 'CHANGELOG.md'],
        message: 'chore: bump version to ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/exec',
      {
        publishCmd: './helpers/publish.sh ${nextRelease.version}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: ['build/*.zip'],
      },
    ],
  ],
};
