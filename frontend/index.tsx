import { Extension } from '@extension/Extension';
import { ExtensionMetadata } from '@extension/Metadata';
import { UserInfo } from '@extension/shared';
import { callable, Millennium } from '@steambrew/client';
import { startIntervalForUpdate as startIntervalForUpdates } from 'updates/updater';
import { handleUrlScheme } from 'urlSchemeHandler';
import { OnPopupCreation } from './onPopupCreation';
import { getUserInfo, initPluginDir } from './shared';
import { WebkitWrapper } from './webkit';

const GetExtensionsInfos = callable<[], string>('GetExtensionsInfos');

const extensions = new Map<string, Extension>();
// @ts-expect-error globalThis is missing type
globalThis.extensions = extensions;
let extensionsDir: string;

let userInfo: UserInfo;

const global = {
  webkit: new WebkitWrapper(),
  getUserInfo: (): string => JSON.stringify(userInfo),
  removeExtension: (name: string): void => { extensions.delete(name); },
};
// @ts-expect-error ignore
Millennium.exposeObj(global);

// Entry point on the front end of your plugin
export default async function PluginMain(): Promise<void> {
  SteamClient.URL.RegisterForRunSteamURL('extendium', handleUrlScheme);
  userInfo = await getUserInfo();
  const infos = JSON.parse(await GetExtensionsInfos()) as { extensionsDir: string; pluginDir: string; manifests: Record<string, chrome.runtime.ManifestV3>; metadatas?: Record<string, ExtensionMetadata>; };
  const manifests = infos.manifests;
  initPluginDir(infos.pluginDir);
  extensionsDir = infos.extensionsDir.replaceAll('\\', '/');
  const extensionsUrl = `https://js.millennium.app/${extensionsDir}`;
  const extensionObjects = [];
  for (const [folderName, manifest] of Object.entries(manifests)) {
    extensionObjects.push(new Extension(manifest, `${extensionsUrl}/${folderName}`, folderName, infos.metadatas?.[folderName]));
  }

  await Promise.all(extensionObjects.map(async (extension) => {
    await extension.init();
    extensions.set(extension.getName(), extension);
  }));

  global.webkit.init(extensions);

  startIntervalForUpdates();

  const wnd = g_PopupManager.GetExistingPopup('SP Desktop_uid0');
  if (wnd) {
    OnPopupCreation(wnd);
  }
  g_PopupManager.AddPopupCreatedCallback(OnPopupCreation);
}
