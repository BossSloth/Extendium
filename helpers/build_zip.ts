import { $, Glob } from 'bun';
import chalk from 'chalk';
import { existsSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const INCLUDED = [
  '.millennium/Dist',
  'backend',
  'LICENSE',
  'README.md',
  'plugin.json',
  'metadata.json',
  'CHANGELOG.md',
  'fake-header-extension'
];

const EXCLUDED = [
  '.scss',
];

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const PLUGIN_NAME = 'extendium';

async function runBuild(): Promise<boolean> {
  console.log(chalk.cyan.bold('Running bun build...'));

  try {
    const result = await $`FORCE_COLOR=1 bun run build`.cwd(ROOT_DIR);

    if (result.exitCode !== 0) {
      console.log(chalk.red.bold('✗ Build failed'));
      return false;
    }

    console.log(chalk.green.bold('✓ Build completed successfully'));
    return true;
  }
  catch (e) {
    console.error(chalk.red(`Error running build: ${e}`));
    return false;
  }
}

async function collectFiles(includedPath: string): Promise<string[]> {
  const fullPath = path.join(ROOT_DIR, includedPath);

  if (!existsSync(fullPath)) {
    console.log(chalk.yellow(`⚠ Warning: ${fullPath} does not exist. Skipping.`));
    return [];
  }

  const stat = statSync(fullPath);

  if (stat.isFile()) {
    return [includedPath];
  }

  // It's a directory, collect all files recursively
  const files: string[] = [];
  const glob = new Glob('**/*');

  for await (const file of glob.scan({ cwd: fullPath, onlyFiles: true })) {
    files.push(path.join(includedPath, file));
  }

  return files;
}

async function createZip(version: string): Promise<boolean> {
  const zipName = `${PLUGIN_NAME}-${version}.zip`;
  const buildDir = path.join(ROOT_DIR, 'build');
  await mkdir(buildDir, { recursive: true });
  const zipPath = path.join(buildDir, zipName);

  console.log(chalk.magenta.bold(`\n📦 Creating zip file: ${chalk.white(zipPath)}`));

  // Collect all files to include
  const allFiles: string[] = [];
  for (const included of INCLUDED) {
    const files = await collectFiles(included);
    allFiles.push(...files);
  }

  // Filter out excluded files
  const filteredFiles = allFiles.filter((file) => {
    if (EXCLUDED.some(excluded => file.includes(excluded))) {
      console.log(chalk.gray(`- Skipping: ${PLUGIN_NAME}/${file}`));
      return false;
    }
    return true;
  });

  const zipEntries: string[] = [];
  for (const file of filteredFiles) {
    const archivePath = `${PLUGIN_NAME}/${file}`;
    console.log(chalk.blue(`+ Adding: ${chalk.white(archivePath)}`));
    zipEntries.push(file);
  }

  // Create a temporary directory structure and zip it
  const tempDir = path.join(buildDir, PLUGIN_NAME);
  await $`rm -rf ${tempDir}`.cwd(ROOT_DIR).quiet();
  await mkdir(tempDir, { recursive: true });

  // Copy files to temp directory maintaining structure
  for (const file of filteredFiles) {
    const srcPath = path.join(ROOT_DIR, file);
    const destPath = path.join(tempDir, file);
    const destDir = path.dirname(destPath);
    await mkdir(destDir, { recursive: true });
    await $`cp ${srcPath} ${destPath}`.quiet();
  }

  // Create zip from the temp directory
  await $`rm -f ${zipPath}`.quiet();
  await $`zip -r ${zipPath} ${PLUGIN_NAME}`.cwd(buildDir).quiet();

  // Clean up temp directory
  await $`rm -rf ${tempDir}`.quiet();

  console.log(chalk.green.bold('\n✓ Zip file created successfully!'));
  return true;
}

async function main(): Promise<void> {
  const version = process.env.RELEASE_VERSION ?? '';

  if (!version) {
    console.error(chalk.red.bold('✗ Error: RELEASE_VERSION environment variable is required'));
    process.exit(1);
  }

  if (!await runBuild()) {
    process.exit(1);
  }

  if (!await createZip(version)) {
    process.exit(1);
  }

  console.log(chalk.green.bold('\n🎉 Build and zip creation completed!'));
}

main();
