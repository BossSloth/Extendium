import { findClass } from '@steambrew/client';
import { openExtensionSettingsPopup } from 'components/ExtensionSettingsPopup';
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

  backgroundWindow.document.title = `${extension.getName()} - ${title}`;

  // Add base tag
  const base = document.createElement('base');
  base.href = baseHref;
  backgroundWindow.document.head.appendChild(base);

  // const backgroundWindow = backgroundPopup.m_popupContextMenu.m_popup;
  injectBrowser(title, backgroundWindow, extension);

  return backgroundWindow;
}

export async function createWindowWithScript(scriptPath: string, extension: Extension, title: string): Promise<Window> {
  const script = extension.getFileUrl(scriptPath);
  if (script === undefined) {
    throw new Error(`Script ${scriptPath} not found`);
  }

  const backgroundWindow = createWindow(extension, title, extension.getFileDir(scriptPath));

  try {
    await loadScript(script, backgroundWindow.document);
  } catch (error) {
    extension.logger.error('createWindowWithScript', error);
  }

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

export async function injectHtml(html: string, popupWindow: Window, extension: Extension, addToBody = true, removeSteamCss = true, baseUrl?: string): Promise<void> {
  const popupDocument = popupWindow.document;
  // Remove all steam css
  if (removeSteamCss) {
    popupDocument.querySelectorAll('head > link[rel="stylesheet"]').forEach((link) => {
      link.remove();
    });
  }

  // Inject the chrome variable
  injectBrowser('popup', popupWindow, extension);

  // Get the script tags and add them to the head
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');

  if (baseUrl !== undefined) {
    const docBase = doc.createElement('base');
    docBase.setAttribute('href', baseUrl);
    doc.head.appendChild(docBase);
  }

  // Get all head children and append them to the current document
  const headElements = doc.head.querySelectorAll('*');
  for (const head of headElements) {
    if (head.tagName === 'SCRIPT') {
      // eslint-disable-next-line no-await-in-loop
      await loadScript(head.getAttribute('src') ?? '', popupDocument, head.attributes);

      continue;
    }

    if (head.tagName === 'LINK' && head.getAttribute('rel') === 'stylesheet') {
      // eslint-disable-next-line no-await-in-loop
      await loadStyle((head as HTMLLinkElement).href, popupDocument);

      // Delete copied style
      popupDocument.body.querySelector(`link[href="${head.getAttribute('href')}"]`)?.remove();

      continue;
    }

    if (head.tagName === 'STYLE') {
      if (head.textContent === null) {
        continue;
      }

      head.textContent = replaceBodyStyle(head.textContent);
    }

    popupDocument.head.appendChild(head);
  }

  // Add all body script tags
  const bodyScripts = doc.body.querySelectorAll('script');
  for (const script of bodyScripts) {
    // eslint-disable-next-line no-await-in-loop
    await loadScript(script.getAttribute('src') ?? '', popupDocument, script.attributes);
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

  injectModalStyle(popupDocument);

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

  openExtensionSettingsPopup(
    <ExtensionPopup
      extension={extension}
      popupContentUrl={extension.getFileUrl(url) ?? ''}
      baseDir={extension.getFileDir(url)}
      removeSteamCss={false}
      centerPopup
    />,
    `${extension.action.getTitle()} - Options`,
  );
}

function injectModalStyle(popupDocument: Document): void {
  let cssContent = customModalStyle;
  const steamClassNames = [...cssContent.matchAll(/\.__(\w+)__/g)];
  steamClassNames.forEach((className) => {
    if (className[1] === undefined) return;
    const realClassName = findClass(className[1]) as string;
    cssContent = cssContent.replaceAll(className[0], `.${realClassName}`);
  });

  const style = document.createElement('style');
  style.textContent = cssContent;
  popupDocument.head.appendChild(style);
}

const customModalStyle = /* css */`
.__ContextMenuPosition__:has(.extendium-popup) {
  outline: none !important;
}
.TitleBar {
  height: 32px !important;
}
*:has(>.extendium-popup) {
  min-height: unset !important;
}
.DialogContent {
  padding: 0 !important;
}
body {
  margin: 0 !important;
  padding: 0 !important;
}
`;

async function loadStyle(src: string, document: Document): Promise<void> {
  let content = await fetch(src).then(async r => r.text());
  content = replaceBodyStyle(content);
  content += `\n//# sourceURL=${src}`;

  const style = document.createElement('style');
  style.textContent = content;
  style.setAttribute('original-src', src);
  document.head.appendChild(style);
}

function replaceBodyStyle(content: string): string {
  return content
    .replace(/(\b|\\n)(?:body) *\{/gm, '$1.extendium-popup { font-size: 75%; font-family: "Segoe UI", Tahoma, sans-serif;')
    .replace(/(\b|\\n)(?:html) *\{/gm, '$1html,.extendium-popup {');
}
