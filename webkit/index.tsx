import { callable } from '@steambrew/webkit';
import { createChrome } from './createChrome';
import { createContentScripts } from './createContentScripts';
import { Extension } from './extension/Extension';
import { ExtensionWrapper } from './ExtensionWrapper';
import { createFakeSteamHeader } from './fake-header';
import { initWebSocketClient, onDomReady } from './shared';
import { TabInject } from './TabInject';

const GetExtensionsInfos = callable<[], string>('GetExtensionsInfos');

const extensions = new Map<string, ExtensionWrapper>();
window.extensions = extensions;

export default async function WebkitMain(): Promise<void> {
  performance.mark('[Extendium] WebkitMain start');
  // Add fake header to steam pages
  if (window.location.href.includes('https://store.steampowered.com') || window.location.href.includes('https://steamcommunity.com')) {
    onDomReady(() => {
      createFakeSteamHeader();
    });
  }

  initWebSocketClient();

  const startMark = performance.mark('[Extendium] WebkitMain extensions loading start');
  const extensionInfos = JSON.parse(await GetExtensionsInfos()) as { extensionsDir: string; manifests: Record<string, chrome.runtime.ManifestV3>; };
  const manifests = extensionInfos.manifests;
  const extensionsDir = extensionInfos.extensionsDir.replaceAll('\\', '/');
  const endMark = performance.mark('[Extendium] WebkitMain extensions loaded');
  performance.measure('[Extendium] WebkitMain extensions loading', startMark.name, endMark.name);
  const extensionsUrl = `https://js.millennium.app/${extensionsDir}`;
  for (const [folderName, manifest] of Object.entries(manifests)) {
    const extension = new Extension(manifest, `${extensionsUrl}/${folderName}`);
    const chrome = createChrome('content', extension);
    extensions.set(manifest.name, new ExtensionWrapper(extension, chrome));
  }

  await Promise.all([...extensions.values()].map(async wrapper => createContentScripts(wrapper.extension)));
  performance.mark('[Extendium] WebkitMain content scripts created done');

  TabInject();
}
