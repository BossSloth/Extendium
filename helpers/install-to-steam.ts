#!/usr/bin/env bun
/**
 * Steam Extension Installer
 *
 * Minimal user-facing script to install a Chromium extension into Steam.
 * Dependencies: Only Node.js/Bun built-ins (fs, crypto, os, path, child_process)
 *
 * Prerequisites:
 * - Run generate-extension-keys.ts first to set up the extension
 * - manifest.json must contain the "key" field with the public key
 */

import { execSync } from 'child_process';
import { createHash, createHmac } from 'crypto';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { homedir, platform } from 'os';
import { join, resolve } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const EXTENSION_DIR = resolve(join(import.meta.dir, '..', 'fake-header-extension'));

function getSteamConfigDir(): string {
  if (platform() === 'win32') {
    return join(homedir(), 'AppData/Local/Steam/htmlcache/Default');
  }
  return join(homedir(), '.local/share/Steam/config/htmlcache/Default');
}

function getSteamResourcesPakPath(): string {
  if (platform() === 'win32') {
    return 'C:\\Program Files (x86)\\Steam\\bin\\cef\\cef.win64\\resources.pak';
  }
  const paths = [
    join(homedir(), '.local/share/Steam/ubuntu12_64/resources.pak'),
    join(homedir(), '.local/share/Steam/ubuntu12_32/resources.pak'),
    join(homedir(), '.local/share/Steam/linux64/resources.pak'),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return paths[0] ?? '';
}

// ============================================================================
// Types
// ============================================================================

interface ChromePreferences {
  extensions?: {
    settings?: Record<string, ExtensionSettings>;
    ui?: { developer_mode?: boolean; [key: string]: unknown };
    [key: string]: unknown;
  };
  protection?: {
    macs?: {
      extensions?: { settings?: Record<string, string>; [key: string]: unknown };
      [key: string]: unknown;
    };
    ui?: Record<string, string>;
    super_mac?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ExtensionSettings {
  active_permissions?: { api: string[]; explicit_host?: string[]; manifest_permissions: string[]; scriptable_host?: string[] };
  commands?: Record<string, unknown>;
  content_settings?: unknown[];
  creation_flags?: number;
  first_install_time?: string;
  from_webstore?: boolean;
  granted_permissions?: { api: string[]; explicit_host?: string[]; manifest_permissions: string[]; scriptable_host?: string[] };
  incognito_content_settings?: unknown[];
  incognito_preferences?: Record<string, unknown>;
  last_update_time?: string;
  location?: number;
  newAllowFileAccess?: boolean;
  path?: string;
  preferences?: Record<string, unknown>;
  regular_only_preferences?: Record<string, unknown>;
  state?: number;
  was_installed_by_default?: boolean;
  was_installed_by_oem?: boolean;
  withholding_permissions?: boolean;
  [key: string]: unknown;
}

// ============================================================================
// Extension ID (computed from public key in manifest)
// ============================================================================

function translateCrxId(hexStr: string): string {
  const mapping: Record<string, string> = {
    '0': 'a', '1': 'b', '2': 'c', '3': 'd', '4': 'e', '5': 'f', '6': 'g', '7': 'h',
    '8': 'i', '9': 'j', 'a': 'k', 'b': 'l', 'c': 'm', 'd': 'n', 'e': 'o', 'f': 'p',
  };
  return hexStr.split('').map(c => mapping[c] || c).join('');
}

function computeExtensionId(publicKeyBase64: string): string {
  const publicKeyBuffer = Buffer.from(publicKeyBase64, 'base64');
  const hash = createHash('sha256').update(publicKeyBuffer).digest();
  return translateCrxId(hash.subarray(0, 16).toString('hex'));
}

function getWindowsFileTime(): string {
  const epochDiff = 11644473600000;
  return ((Date.now() + epochDiff) * 10000).toString();
}

// ============================================================================
// HMAC Signature Generation (Windows only)
// ============================================================================

function extractSeedFromPak(pakPath: string): string | null {
  if (!existsSync(pakPath)) return null;

  const data = readFileSync(pakPath);
  const version = data.readUInt32LE(0);

  let headerSize: number, numResources: number;
  if (version === 5) {
    numResources = data.readUInt16LE(6);
    headerSize = 12;
  } else if (version === 4) {
    numResources = data.readUInt32LE(4);
    headerSize = 9;
  } else {
    return null;
  }

  const entries: Array<{ resId: number; offset: number }> = [];
  for (let i = 0; i < numResources + 1; i++) {
    const pos = headerSize + i * 6;
    if (pos + 6 > data.length) break;
    entries.push({ resId: data.readUInt16LE(pos), offset: data.readUInt32LE(pos + 2) });
  }

  const candidates: Array<{ resId: number; seed: string }> = [];
  for (let i = 0; i < entries.length - 1; i++) {
    const entry = entries[i], nextEntry = entries[i + 1];
    if (!entry || !nextEntry) continue;
    const size = nextEntry.offset - entry.offset;
    if (size === 64) {
      candidates.push({ resId: entry.resId, seed: data.subarray(entry.offset, nextEntry.offset).toString('hex') });
    }
  }

  const preferred = candidates.find(c => c.resId === 146);
  return preferred?.seed ?? candidates[0]?.seed ?? null;
}

function getWindowsSid(): string {
  if (platform() !== 'win32') return '';
  try {
    const output = execSync(
      'powershell -Command "[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value"',
      { encoding: 'utf-8' }
    );
    const sid = output.trim();
    if (sid.startsWith('S-1-')) {
      const parts = sid.split('-');
      parts.pop();
      return parts.join('-');
    }
  } catch { /* ignore */ }
  return '';
}

function removeEmptyChildren(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyChildren).filter(item =>
      !(Array.isArray(item) && item.length === 0) &&
      !(typeof item === 'object' && item !== null && Object.keys(item).length === 0)
    );
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeEmptyChildren(value);
      if (Array.isArray(cleanedValue) && cleanedValue.length === 0) continue;
      if (typeof cleanedValue === 'object' && cleanedValue !== null && Object.keys(cleanedValue).length === 0) continue;
      cleaned[key] = cleanedValue;
    }
    return cleaned;
  }
  return obj;
}

function computeMac(seed: Buffer, sid: string, jsonPath: string, value: unknown): string {
  const cleaned = removeEmptyChildren(value);
  const jsonValue = JSON.stringify(cleaned).replace(/</g, '\\u003C').replace(/\\u2122/g, '™');
  const hmac = createHmac('sha256', seed);
  hmac.update(sid + jsonPath + jsonValue, 'utf-8');
  return hmac.digest('hex').toUpperCase();
}

function computeSuperMac(seed: Buffer, sid: string, macs: unknown): string {
  const hmac = createHmac('sha256', seed);
  hmac.update(sid + JSON.stringify(macs), 'utf-8');
  return hmac.digest('hex').toUpperCase();
}

interface HmacContext { seed: Buffer; sid: string }

function initializeHmacContext(): HmacContext | null {
  const sid = getWindowsSid();
  if (!sid) return null;
  console.log(`🔑 Windows SID: ${sid}`);

  const seedHex = extractSeedFromPak(getSteamResourcesPakPath());
  const seed = seedHex ? Buffer.from(seedHex, 'hex') : Buffer.alloc(0);
  return { seed, sid };
}

// ============================================================================
// Main Installation Logic
// ============================================================================

function main() {
  console.log('🚀 Installing Extension to Steam...\n');

  // Read manifest and extract public key
  const manifestPath = join(EXTENSION_DIR, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`❌ Manifest not found: ${manifestPath}`);
    console.error('   Run generate-extension-keys.ts first!');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  if (!manifest.key) {
    console.error('❌ Manifest missing "key" field.');
    console.error('   Run generate-extension-keys.ts first!');
    process.exit(1);
  }

  const extensionId = computeExtensionId(manifest.key);
  const targetExtensionDir = realpathSync(EXTENSION_DIR);

  console.log(`🔑 Extension ID: ${extensionId}`);
  console.log(`📦 Extension: ${manifest.name} v${manifest.version}`);
  console.log(`📂 Path: ${targetExtensionDir}`);

  // Extract permissions from manifest
  const permissions = manifest.permissions || [];
  const apiPermissions = permissions.filter((p: string) =>
    !p.includes('://') && !p.startsWith('<') && !p.startsWith('*')
  );

  // Build extension settings
  const extensionSettings: ExtensionSettings = {
    active_permissions: {
      api: apiPermissions,
      explicit_host: ['<all_urls>'],
      manifest_permissions: [],
      scriptable_host: ['<all_urls>'],
    },
    commands: {},
    content_settings: [],
    creation_flags: 38,
    first_install_time: getWindowsFileTime(),
    from_webstore: false,
    granted_permissions: {
      api: apiPermissions,
      explicit_host: ['<all_urls>'],
      manifest_permissions: [],
      scriptable_host: ['<all_urls>'],
    },
    incognito_content_settings: [],
    incognito_preferences: {},
    last_update_time: getWindowsFileTime(),
    location: 4,
    newAllowFileAccess: true,
    path: targetExtensionDir,
    preferences: {},
    regular_only_preferences: {},
    state: 1,
    was_installed_by_default: false,
    was_installed_by_oem: false,
    withholding_permissions: false,
  };

  // Initialize HMAC context (Windows only)
  const isWindows = platform() === 'win32';
  let hmacContext: HmacContext | null = null;

  if (isWindows) {
    console.log('\n🔐 Initializing HMAC context...');
    hmacContext = initializeHmacContext();
    if (!hmacContext) {
      console.log('⚠️  Could not initialize HMAC. Extension may not load.');
    }
  }

  // Update preferences files
  const steamConfigDir = getSteamConfigDir();
  const preferencesFile = join(steamConfigDir, 'Preferences');
  const securePreferencesFile = join(steamConfigDir, 'Secure Preferences');

  for (const [filePath, isSecure] of [[preferencesFile, false], [securePreferencesFile, true]] as const) {
    if (!existsSync(filePath)) {
      if (isSecure) continue;
    }

    console.log(`\n📝 Updating ${isSecure ? 'Secure Preferences' : 'Preferences'}...`);

    let prefs: ChromePreferences = {};
    try {
      prefs = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      if (isSecure) continue;
    }

    // Set up extension structure
    if (!prefs.extensions) prefs.extensions = {};
    if (!prefs.extensions.settings) prefs.extensions.settings = {};
    if (!prefs.extensions.ui) prefs.extensions.ui = {};

    prefs.extensions.ui.developer_mode = true;
    prefs.extensions.settings[extensionId] = extensionSettings;

    // Add HMAC signatures if needed
    if (hmacContext) {
      if (!prefs.protection) prefs.protection = {};
      if (!prefs.protection.macs) prefs.protection.macs = {};
      if (!prefs.protection.macs.extensions) prefs.protection.macs.extensions = {};
      if (!prefs.protection.macs.extensions.settings) prefs.protection.macs.extensions.settings = {};
      if (!prefs.protection.ui) prefs.protection.ui = {};

      const extMac = computeMac(hmacContext.seed, hmacContext.sid, `extensions.settings.${extensionId}`, extensionSettings);
      prefs.protection.macs.extensions.settings[extensionId] = extMac;

      const devModeMac = computeMac(hmacContext.seed, hmacContext.sid, 'extensions.ui.developer_mode', true);
      prefs.protection.ui.developer_mode = devModeMac;

      if (isSecure) {
        const superMac = computeSuperMac(hmacContext.seed, hmacContext.sid, prefs.protection.macs);
        prefs.protection.super_mac = superMac;
        console.log(`✅ Super MAC: ${superMac.substring(0, 16)}...`);
      }
    }

    writeFileSync(filePath, JSON.stringify(prefs, null, 2), 'utf-8');
    console.log(`✅ ${isSecure ? 'Secure Preferences' : 'Preferences'} updated`);
  }

  if (isWindows) {
    execSync('taskkill /F /IM steamwebhelper.exe')
  } else {
    execSync('pkill -f steamwebhelper')
  }

  console.log('\n✨ Installation complete!');
  console.log('\n📌 Next steps:');
  console.log('   1. Close Steam completely');
  console.log('   2. Restart Steam');
  console.log('   3. The extension will be loaded automatically');
}

main();
