import { Extension } from '@extension/Extension';
import { ExtensionInfos } from '@extension/Metadata';
import { steamRequestIDKey } from '@extension/requests/crossRequestKeys';
import { callable } from '@steambrew/webkit';
import { createChrome } from './createChrome';
import { createContentScripts } from './createContentScripts';
import { ExtensionWrapper } from './ExtensionWrapper';
import { startCreateFakeSteamHeader } from './fake-header/fake-header';
import { linkClickInterceptor } from './linkModifier';
import { initWebSocketClient, isSteamPage } from './shared';
import { handleSteamRequests } from './steam-requests/handle-steam-requests';
import { TabInject } from './TabInject';

const GetExtensionsInfos = callable<[], string>('GetExtensionsInfos');

const extensions = new Map<string, ExtensionWrapper>();
window.extensions = extensions;

export default async function WebkitMain(): Promise<void> {
  performance.mark('[Extendium] WebkitMain start');
  // performance.measure('[Extendium] WebkitMain loading', '[Millennium] inject-end', '[Extendium] WebkitMain start');
  // performance.measure('Total load time', '[Millennium] preload-start', '[Extendium] WebkitMain start');
  initWebSocketClient();
  // Add fake header to steam pages
  if (isSteamPage()) {
    const steamRequestID = new URLSearchParams(window.location.search).get(steamRequestIDKey);
    if (steamRequestID !== null) {
      handleSteamRequests();

      return;
    }

    startCreateFakeSteamHeader();
  }

  const startMark = performance.mark('[Extendium] WebkitMain extensions loading start');
  const extensionInfos = JSON.parse(await GetExtensionsInfos()) as ExtensionInfos
  const manifests = extensionInfos.manifests;
  const extensionsDir = extensionInfos.extensionsDir.replaceAll('\\', '/');
  const endMark = performance.mark('[Extendium] WebkitMain extensions loaded');
  performance.measure('[Extendium] WebkitMain extensions loading', startMark.name, endMark.name);
  const extensionsUrl = `https://js.millennium.app/${extensionsDir}`;
  const extensionObjects: Extension[] = [];
  for (const [folderName, manifest] of Object.entries(manifests)) {
    const extension = new Extension(manifest, `${extensionsUrl}/${folderName}`, folderName);
    extensionObjects.push(extension);
  }

  await Promise.all(extensionObjects.map(async extension => {
    await extension.init();
    const chrome = createChrome('content', extension);
    extensions.set(extension.getName(), new ExtensionWrapper(extension, chrome));
    await createContentScripts(extension)
  }));

  linkClickInterceptor(extensions, extensionInfos.externalLinks ?? []);
  performance.mark('[Extendium] WebkitMain content scripts created done');

  TabInject();
}
