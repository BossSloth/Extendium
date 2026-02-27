/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Extension } from '@extension/Extension';
import { Logger } from '@extension/Logger';
import { findModule } from '@steambrew/client';
import { extendiumStyles } from 'components/Styles';
import { initializeExtension } from 'extensionInitialization';
import { MainWindowPopup, Popup } from 'steam-types/Global/managers/PopupManager';
import { checkAndEmitInstallEvent } from 'updates/updater';
import { initMainWindow, MAIN_WINDOW_NAME, WaitForElement } from './shared';
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

  await initializeExtension();

  addStyles(popup);

  const backgroundPromises: Promise<void>[] = [];
  for (const extension of extensions_old.values()) {
    backgroundPromises.push(setupBackground(extension).catch((e: unknown) => {
      Logger.globalLog('Background-init', 'Failed to setup background for extension:', extension.getName(), e);
    }));
  }
  await Promise.all(backgroundPromises);

  patchUrlBar(extensions_old, popup.m_popup.document);
}

async function OnTabbedPopupBrowserCreation(popup: Popup): Promise<void> {
  addStyles(popup);

  await patchUrlBar(extensions_old, popup.m_popup.document);

  function observerCallback(): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (popup.m_popup === undefined) {
      observer.disconnect();

      return;
    }

    if (!popup.m_popup.document.querySelector('.extensions-bar-container')) {
      patchUrlBar(extensions_old, popup.m_popup.document);
    }
  }

  const urlBar = await WaitForElement(`.${findModule(e => e.BrowserTabIcon).URLBar}`, popup.m_popup.document);

  const observer = new MutationObserver(observerCallback);

  observer.observe(urlBar!.parentElement!, { childList: true, subtree: true });
}

function addStyles(popup: Popup): void {
  const style = document.createElement('style');
  style.textContent = extendiumStyles;
  popup.m_popup.document.head.appendChild(style);
}

async function setupBackground(extension: Extension): Promise<void> {
  const backgroundScriptUrl = extension.manifest.background?.service_worker;

  if (backgroundScriptUrl === undefined) {
    return;
  }

  const backgroundWindow = await createWindowWithScript(
    backgroundScriptUrl,
    extension,
    'Background',
    extension.manifest.background?.type === 'module',
  );

  extension.contexts.addContext(backgroundWindow, 'BACKGROUND', extension.getBackgroundUrl());

  checkAndEmitInstallEvent(extension);
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

export function getOptionLinks(): Map<string, Extension> {
  return [...extensions_old.values()].map((extension): [string, Extension] => {
    const link = extension.getFileUrl(extension.options.getOptionsPageUrl()) ?? '';

    return [link, extension];
  }).filter(link => link[0] !== '').reduce((map, [key, value]) => map.set(key, value), new Map<string, Extension>());
}
