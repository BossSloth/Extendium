import { callable } from '@steambrew/webkit';
import { createChrome } from './createChrome';
import { createContentScripts } from './createContentScripts';
import { Extension } from './extension/Extension';
import { ExtensionWrapper } from './ExtensionWrapper';
import { createFakeSteamHeader } from './fake-header';
import { TabInject } from './TabInject';

const GetExtensionManifests = callable<[], string>('GetExtensionManifests');
const GetExtensionsDir = callable<[], string>('GetExtensionsDir');

const extensions = new Map<string, ExtensionWrapper>();
window.extensions = extensions;

export default async function WebkitMain(): Promise<void> {
  // Add fake header to steam pages
  if (window.location.href.includes('https://store.steampowered.com') || window.location.href.includes('https://steamcommunity.com')) {
    await createFakeSteamHeader();
  }

  const manifests = JSON.parse(await GetExtensionManifests()) as Record<string, chrome.runtime.ManifestV3>;
  const extensionsDir = (await GetExtensionsDir()).replaceAll('\\', '/');
  const extensionsUrl = `https://js.millennium.app/${extensionsDir}`;
  for (const [folderName, manifest] of Object.entries(manifests)) {
    const extension = new Extension(manifest, `${extensionsUrl}/${folderName}`);
    const chrome = createChrome('content', extension);
    extensions.set(manifest.name, new ExtensionWrapper(extension, chrome));
  }

  await Promise.all([...extensions.values()].map(async (wrapper) => {
    await wrapper.extension.init();
    await createContentScripts(wrapper.extension);
  }));

  TabInject();
}
