import { callable, Millennium } from '@steambrew/client';
import { Extension } from './extension/Extension';
import { UserInfo } from './extension/shared';
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
  userInfo = await getUserInfo();
  const infos = JSON.parse(await GetExtensionsInfos()) as { extensionsDir: string; pluginDir: string; manifests: Record<string, chrome.runtime.ManifestV3>; };
  const manifests = infos.manifests;
  initPluginDir(infos.pluginDir);
  extensionsDir = infos.extensionsDir.replaceAll('\\', '/');
  const extensionsUrl = `https://js.millennium.app/${extensionsDir}`;
  const extensionObjects = [];
  for (const [folderName, manifest] of Object.entries(manifests)) {
    extensionObjects.push(new Extension(manifest, `${extensionsUrl}/${folderName}`, folderName));
  }

  await Promise.all(extensionObjects.map(async (extension) => {
    await extension.init();
    extensions.set(extension.getName(), extension);
  }));

  global.webkit.init(extensions);

  const wnd = g_PopupManager.GetExistingPopup('SP Desktop_uid0');
  if (wnd) {
    OnPopupCreation(wnd);
  }
  g_PopupManager.AddPopupCreatedCallback(OnPopupCreation);
}
