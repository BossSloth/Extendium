import { ExtensionMetadata } from '@extension/Metadata';
import { base64Encode } from '@extension/utils';
import { callable } from '@steambrew/client';

const chromeURLPattern = /^https?:\/\/chromewebstore.google.com\/detail\/(.+?)\/([a-z]{32})(?=[/#?]|$)/;

const DownloadExtensionFromUrl = callable<[{ url: string; metadata: string; name: string; }], boolean>('DownloadExtensionFromUrl');

function getChromeVersion(): { major?: number; minor?: number; build?: number; patch?: number; } {
  const pieces = navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
  if (pieces === null || pieces.length !== 5) {
    throw new Error('Could not get Chrome version');
  }
  const [, major, minor, build, patch] = pieces.map(piece => parseInt(piece, 10));

  return {
    major,
    minor,
    build,
    patch,
  };
}

function getNaclArch(): string {
  let naclArch = 'arm';
  if (navigator.userAgent.indexOf('x86') > 0) {
    naclArch = 'x86-32';
  } else if (navigator.userAgent.indexOf('x64') > 0) {
    naclArch = 'x86-64';
  }

  return naclArch;
}
const currentVersion = getChromeVersion();
const version = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.build}.${currentVersion.patch}`;
const naclArch = getNaclArch();

export async function downloadExtensionFromUrl(url: string): Promise<boolean> {
  const match = url.match(chromeURLPattern);

  if (match?.length !== 3) {
    return false;
  }

  const [, extensionName, extensionId] = match;

  if (extensionName === undefined || extensionId === undefined) {
    return false;
  }

  const metadata: ExtensionMetadata = {
    extensionId,
    url,
  };

  return downloadExtensionUpdate(extensionName, metadata);
}

export async function downloadExtensionUpdate(folderName: string, metadata: ExtensionMetadata): Promise<boolean> {
  const downloadUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&x=id%3D${metadata.extensionId}%26installsource%3Dondemand%26uc&nacl_arch=${naclArch}&acceptformat=crx2,crx3`;

  return DownloadExtensionFromUrl({ url: downloadUrl, metadata: base64Encode(JSON.stringify(metadata)), name: folderName });
}
