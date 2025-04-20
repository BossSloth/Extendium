import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

interface PluginJson {
  version: string;
  [key: string]: unknown;
}

const version = process.env.RELEASE_VERSION;
if (version === undefined) {
  console.error('RELEASE_VERSION environment variable is not set');
  process.exit(1);
}

// Update package.json
const packagePath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJson;
packageJson.version = version;
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

// Update plugin.json
const pluginPath = join(process.cwd(), 'plugin.json');
const pluginJson = JSON.parse(readFileSync(pluginPath, 'utf8')) as PluginJson;
pluginJson.version = version;
writeFileSync(pluginPath, `${JSON.stringify(pluginJson, null, 2)}\n`);

console.log(`Updated version to ${version} in package.json and plugin.json`);
