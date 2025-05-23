import { callable, findModule, Millennium } from '@steambrew/client';
import React from 'react';
import { MainWindowPopup, Popup } from 'steam-types/dist/types/Global/PopupManager';
import { ExtensionsBar } from './components/ExtensionsBar';
import { Extension } from './extension/Extension';
import { initMainWindow, MAIN_WINDOW_NAME, WaitForElement } from './shared';
import { WebkitWrapper } from './webkit';
import { createWindowWithScript } from './windowManagement';

const GetExtensionsInfos = callable<[], string>('GetExtensionsInfos');

const extensions = new Map<string, Extension>();
// @ts-expect-error globalThis is missing type
globalThis.extensions = extensions;

let pluginDir: string;
let extensionsDir: string;

function isMainWindow(popup: Popup): popup is MainWindowPopup {
  return popup.m_strName === MAIN_WINDOW_NAME;
}

const global = { webkit: new WebkitWrapper() };
// @ts-expect-error ignore
Millennium.exposeObj(global);

async function addStyles(popup: MainWindowPopup): Promise<void> {
  const folderPath = `${pluginDir.replace(/.*\\([^\\]+)\\([^\\]+)$/, '/$1/$2')}/public`;
  const cssContent = await fetch(`https://css.millennium.app${folderPath}/extendium.css`).then(async r => r.text());
  const style = document.createElement('style');
  style.textContent = cssContent;
  popup.m_popup.document.head.appendChild(style);
}

async function OnPopupCreation(popup: Popup | undefined): Promise<void> {
  if (!popup || !isMainWindow(popup)) {
    return;
  }

  initMainWindow(popup.m_popup);

  await addStyles(popup);

  const backgroundPromises: Promise<void>[] = [];
  for (const extension of extensions.values()) {
    backgroundPromises.push(setupBackground(extension));
  }
  await Promise.all(backgroundPromises);

  const classes = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    steamdesktop: findModule(e => e.FocusBar) as Record<string, string>,
  };
  const urlBar = await WaitForElement(
    `.${classes.steamdesktop.URLBar}`,
    popup.m_popup.document,
  );

  if (!urlBar) {
    return;
  }

  const extensionsBar = document.createElement('div');
  extensionsBar.classList.add('extensions-bar');
  urlBar.appendChild(extensionsBar);

  const reactRoot = SP_REACTDOM.createRoot(extensionsBar);

  reactRoot.render(<ExtensionsBar extensions={extensions} />);
}

async function setupBackground(extension: Extension): Promise<void> {
  const backgroundWindow = await createWindowWithScript(extension.manifest.background?.service_worker ?? '', extension, 'Background');
  extension.contexts.addContext(backgroundWindow, 'BACKGROUND', extension.getBackgroundUrl());
}

// Entry point on the front end of your plugin
export default async function PluginMain(): Promise<void> {
  const infos = JSON.parse(await GetExtensionsInfos()) as { extensionsDir: string; pluginDir: string; manifests: Record<string, chrome.runtime.ManifestV3>; };
  const manifests = infos.manifests;
  pluginDir = infos.pluginDir;
  extensionsDir = infos.extensionsDir.replaceAll('\\', '/');
  const extensionsUrl = `https://js.millennium.app/${extensionsDir}`;
  for (const [folderName, manifest] of Object.entries(manifests)) {
    extensions.set(manifest.name, new Extension(manifest, `${extensionsUrl}/${folderName}`));
  }

  await Promise.all([...extensions.values()].map(async (extension) => {
    await extension.init();
  }));

  global.webkit.init(extensions);

  const wnd = g_PopupManager.GetExistingPopup('SP Desktop_uid0');
  if (wnd) {
    OnPopupCreation(wnd);
  }
  g_PopupManager.AddPopupCreatedCallback(OnPopupCreation);
}
