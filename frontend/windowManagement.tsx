import { ModalRoot, showModal } from '@steambrew/client';
import React from 'react';
import { injectBrowser } from './browser/injectBrowser';
import { ExtensionPopup } from './components/ExtensionPopup';
import { Extension } from './extension/Extension';
import { loadScript, mainWindow } from './shared';

export function createWindow(extension: Extension, title: string, baseHref: string): Window {
  const popup = SteamClient.BrowserView.CreatePopup({ parentPopupBrowserID: mainWindow.SteamClient.Browser.GetBrowserID() });
  const backgroundWindow = window.open(popup.strCreateURL);
  if (!backgroundWindow) {
    throw new Error('Failed to create window');
  }
  backgroundWindow.SteamClient.Window.HideWindow();

  backgroundWindow.document.title = `${extension.manifest.name} - ${title}`;

  // Add base tag
  const base = document.createElement('base');
  base.href = baseHref;
  backgroundWindow.document.head.appendChild(base);

  // const backgroundWindow = backgroundPopup.m_popupContextMenu.m_popup;
  injectBrowser(title, backgroundWindow, extension, { createOffscreen });

  return backgroundWindow;
}

export async function createWindowWithScript(scriptPath: string, extension: Extension, title: string): Promise<Window> {
  const script = extension.getFileUrl(scriptPath);
  if (script === undefined) {
    throw new Error(`Script ${scriptPath} not found`);
  }

  const backgroundWindow = createWindow(extension, title, extension.getFileDir(scriptPath));

  await loadScript(script, backgroundWindow.document);

  return backgroundWindow;
}

export async function createOffscreen(extension: Extension, title: string, initUrl: string): Promise<Window> {
  const window = createWindow(extension, title, extension.getFileDir(initUrl));
  const url = extension.getFileUrl(initUrl) ?? '';
  const popupContent = await fetch(url).then(async r => r.text());
  await injectHtml(popupContent, window, extension);

  extension.contexts.addContext(window, 'OFFSCREEN_DOCUMENT', url);

  return window;
}

export async function closeOffscreen(extension: Extension): Promise<void> {
  // @ts-expect-error contextType is wrong type
  const contexts = await extension.contexts.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  const context = contexts[0];
  if (!context) {
    throw new Error('No offscreen context found');
  }

  const popupWindow = context.popupWindow;

  popupWindow.close();
}

export async function injectHtml(html: string, popupWindow: Window, extension: Extension, addToBody = true, removeSteamCss = true): Promise<void> {
  const popupDocument = popupWindow.document;
  // Remove all steam css
  if (removeSteamCss) {
    popupDocument.querySelectorAll('head > link[rel="stylesheet"]').forEach((link) => {
      link.remove();
    });
  }

  // Inject the chrome variable
  injectBrowser('popup', popupWindow, extension, { createOffscreen });

  // Get the script tags and add them to the head
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');

  // Get all head children and append them to the current document
  const headElements = doc.head.querySelectorAll('*');
  for (const head of headElements) {
    if (head.tagName === 'SCRIPT') {
      // eslint-disable-next-line no-await-in-loop
      await loadScript(head.getAttribute('src') ?? '', popupDocument);

      continue;
    }
    popupDocument.head.appendChild(head);
  }

  // Add all body script tags
  const bodyScripts = doc.body.querySelectorAll('script');
  for (const script of bodyScripts) {
    // eslint-disable-next-line no-await-in-loop
    await loadScript(script.getAttribute('src') ?? '', popupDocument);
  }

  // Get all body children and append them to the current document
  if (addToBody) {
    for (const body of doc.body.querySelectorAll('*')) {
      popupDocument.body.appendChild(body);
    }
  }

  const dialogContent: HTMLElement | null = popupDocument.querySelector('.DialogContent');
  if (dialogContent) {
    dialogContent.style.padding = '2px';
  }

  const aTags = popupDocument.querySelectorAll('a:not([target])');
  for (const aTag of aTags) {
    aTag.setAttribute('target', '_blank');
  }

  popupDocument.dispatchEvent(new Event('DOMContentLoaded', {
    bubbles: true,
    cancelable: true,
  }));

  popupWindow.dispatchEvent(new Event('load', {
    bubbles: true,
    cancelable: true,
  }));
}

export function createOptionsWindow(extension: Extension): void {
  const url = extension.manifest.options_ui?.page ?? '';

  // TODO: this window is now not resizable which makes it sometimes hard to change settings
  showModal(
    <ModalRoot>
      <ExtensionPopup extension={extension} popupContentUrl={extension.getFileUrl(url) ?? ''} baseDir={extension.getFileDir(url)} removeSteamCss={false} />
    </ModalRoot>,
    mainWindow,
    {
      // bOverlapHorizontal: true,
      // bGrowToElementWidth: true,
      // bForcePopup: true,
      // bDisableMouseOverlay: true,
      // bCreateHidden: false,
      // bRetainOnHide: false,
      // bNoFocusWhenShown: undefined,
      popupHeight: mainWindow.innerHeight / 2,
      popupWidth: mainWindow.innerWidth / 2,
      bNeverPopOut: true,
      strTitle: `${extension.action.getTitle()} - Options`,
    },
  );
}
