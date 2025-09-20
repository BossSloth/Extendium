/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Extension } from '@extension/Extension';
import { findModule } from '@steambrew/client';
import { MainWindowPopup, Popup } from 'steam-types/dist/types/Global/PopupManager';
import { initMainWindow, MAIN_WINDOW_NAME, pluginDir, WaitForElement } from './shared';
import { patchUrlBar } from './urlBarPatch';
import { createOptionsWindow, createWindowWithScript } from './windowManagement';

export async function OnPopupCreation(popup: Popup | undefined): Promise<void> {
  if (!popup) return;

  if (isMainWindow(popup)) {
    await OnMainWindowCreation(popup);
  }

  if (popup.m_strName.includes('TabbedPopupBrowser') || popup.m_strName.includes('OverlayBrowser')) {
    await OnTabbedPopupBrowserCreation(popup);
  }
  modifyLinks(popup.m_popup.document);
}

async function OnMainWindowCreation(popup: MainWindowPopup): Promise<void> {
  initMainWindow(popup.m_popup);

  await addStyles(popup);

  const backgroundPromises: Promise<void>[] = [];
  for (const extension of extensions.values()) {
    backgroundPromises.push(setupBackground(extension));
  }
  await Promise.all(backgroundPromises);

  patchUrlBar(extensions, popup.m_popup.document);
}

async function OnTabbedPopupBrowserCreation(popup: Popup): Promise<void> {
  await addStyles(popup);

  await patchUrlBar(extensions, popup.m_popup.document);

  function observerCallback(): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (popup.m_popup === undefined) {
      observer.disconnect();

      return;
    }

    if (!popup.m_popup.document.querySelector('.extensions-bar-container')) {
      patchUrlBar(extensions, popup.m_popup.document);
    }
  }

  const urlBar = await WaitForElement(`.${findModule(e => e.BrowserTabIcon).URLBar}`, popup.m_popup.document);

  const observer = new MutationObserver(observerCallback);

  observer.observe(urlBar!.parentElement!, { childList: true, subtree: true });
}

async function addStyles(popup: Popup): Promise<void> {
  const folderPath = `${pluginDir.replace(/.*\\([^\\]+)\\([^\\]+)$/, '/$1/$2')}/public`;
  const cssContent = await fetch(`https://css.millennium.app${folderPath}/extendium.css`).then(async r => r.text());
  const style = document.createElement('style');
  style.textContent = cssContent;
  popup.m_popup.document.head.appendChild(style);
}

async function setupBackground(extension: Extension): Promise<void> {
  const backgroundScriptUrl = extension.manifest.background?.service_worker;

  if (backgroundScriptUrl === undefined) {
    return;
  }

  const backgroundWindow = await createWindowWithScript(backgroundScriptUrl, extension, 'Background', extension.manifest.background?.type === 'module');
  extension.contexts.addContext(backgroundWindow, 'BACKGROUND', extension.getBackgroundUrl());
}

function isMainWindow(popup: Popup): popup is MainWindowPopup {
  return popup.m_strName === MAIN_WINDOW_NAME;
}

export function modifyLinks(document: Document): void {
  const optionsLinks = getOptionLinks();

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const anchor = target.closest('a');

    if (anchor) {
      const extension = optionsLinks.get(decodeURIComponent(anchor.href));
      if (extension) {
        event.preventDefault(); // stop default link behavior if needed

        createOptionsWindow(extension);
      }
    }
  });
}

function getOptionLinks(): Map<string, Extension> {
  return [...extensions.values()].map((extension): [string, Extension] => {
    const link = extension.getFileUrl(extension.options.getOptionsPageUrl()) ?? '';

    return [link, extension];
  }).filter(link => link[0] !== '').reduce((map, [key, value]) => map.set(key, value), new Map<string, Extension>());
}
