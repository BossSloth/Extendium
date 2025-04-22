import { injectBrowser } from './browser/injectBrowser';
import { Extension } from './extension/Extension';
import { loadScript, mainWindow } from './shared';

export function createWindow(extension: Extension, title: string): Window {
  const popup = SteamClient.BrowserView.CreatePopup({ parentPopupBrowserID: mainWindow.SteamClient.Browser.GetBrowserID() });
  const backgroundWindow = window.open(popup.strCreateURL);
  if (!backgroundWindow) {
    throw new Error('Failed to create window');
  }
  backgroundWindow.SteamClient.Window.HideWindow();

  backgroundWindow.document.title = `${extension.manifest.name} - ${title}`;

  // Add base tag
  const base = document.createElement('base');
  base.href = `${extension.url}/`;
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

  const backgroundWindow = createWindow(extension, title);

  await loadScript(script, backgroundWindow.document);

  return backgroundWindow;
}

export async function createOffscreen(extension: Extension, title: string, initUrl?: string): Promise<Window> {
  const window = createWindow(extension, title);
  const url = extension.getFileUrl(initUrl) ?? '';
  const popupContent = await fetch(url).then(async r => r.text());
  await injectHtml(popupContent, window, extension);

  extension.contexts.addContext(window, 'OFFSCREEN_DOCUMENT', url);

  return window;
}

export async function injectHtml(html: string, popupWindow: Window, extension: Extension, addToBody = true): Promise<void> {
  const popupDocument = popupWindow.document;
  // Remove all steam css
  popupDocument.querySelectorAll('head > link[rel="stylesheet"]').forEach((link) => {
    link.remove();
  });

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

  // Get all body children and append them to the current document
  if (addToBody) {
    const bodyElements = doc.body.querySelectorAll('*');
    for (const body of bodyElements) {
      popupDocument.body.appendChild(body);
    }
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
