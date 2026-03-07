#!/usr/bin/env bun

import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const EXTENSION_SOURCE = resolve(join(import.meta.dir, '..', 'fake-header-extension'));
const KEYS_FILE = join(EXTENSION_SOURCE, 'extension-keys.json');

interface ExtensionKeys {
  extensionId: string;
  publicKey: string;
  privateKey: string;
}

function translateCrxId(hexStr: string): string {
  const mapping: Record<string, string> = {
    '0': 'a', '1': 'b', '2': 'c', '3': 'd',
    '4': 'e', '5': 'f', '6': 'g', '7': 'h',
    '8': 'i', '9': 'j', 'a': 'k', 'b': 'l',
    'c': 'm', 'd': 'n', 'e': 'o', 'f': 'p',
  };
  return hexStr.split('').map(c => mapping[c] || c).join('');
}

async function generateExtensionKeys(): Promise<ExtensionKeys> {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyDer = await crypto.subtle.exportKey('spki', publicKey);
  const publicKeyBuffer = Buffer.from(publicKeyDer);

  const sha256 = createHash('sha256');
  sha256.update(publicKeyBuffer);
  const hash = sha256.digest();
  const extensionId = translateCrxId(hash.subarray(0, 16).toString('hex'));

  const publicKeyBase64 = publicKeyBuffer.toString('base64');
  const privateKeyDer = await crypto.subtle.exportKey('pkcs8', privateKey);
  const privateKeyBase64 = Buffer.from(privateKeyDer).toString('base64');

  return {
    extensionId,
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
  };
}

async function main() {
  console.log('🔑 Extension Key Generator\n');

  const manifestPath = join(EXTENSION_SOURCE, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`❌ Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  let keys: ExtensionKeys;
  if (existsSync(KEYS_FILE)) {
    console.log('📂 Keys already exist, loading...');
    keys = JSON.parse(readFileSync(KEYS_FILE, 'utf-8'));
  } else {
    console.log('🔐 Generating new RSA keypair...');
    keys = await generateExtensionKeys();
    writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
    console.log(`✅ Keys saved to: ${KEYS_FILE}`);
  }

  console.log(`🔑 Extension ID: ${keys.extensionId}`);

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  manifest.key = keys.publicKey;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Manifest updated with public key`);

  console.log(`\n📦 Extension: ${manifest.name} v${manifest.version}`);
  console.log('\n✨ Done! The extension is ready for distribution.');
  console.log('   Users can now run the install script to add it to Steam.');
}

main().catch(error => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
