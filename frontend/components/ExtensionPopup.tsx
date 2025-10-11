import { Extension } from '@extension/Extension';
import React, { JSX, useEffect, useRef, useState } from 'react';
import { changeTagPreserveChildren, mainWindow } from '../shared';
import { injectHtml } from '../windowManagement';

export function ExtensionPopup({
  extension,
  popupContentUrl,
  baseDir,
  centerPopup = false,
  removeSteamCss = true,
  queryParams,
}: {
  readonly extension: Extension;
  readonly popupContentUrl: string;
  readonly baseDir: string;
  readonly centerPopup?: boolean;
  readonly removeSteamCss?: boolean;
  readonly queryParams?: string;
}): JSX.Element {
  const [popupContent, setPopupContent] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);

  function popupWindow(): Window {
    const window = container.current?.ownerDocument.defaultView;
    if (!window) {
      throw new Error('No popup window found');
    }

    return window;
  }

  useEffect(() => {
    async function initPopupContent(): Promise<void> {
      const content = await fetch(popupContentUrl).then(async r => r.text());
      // content = content.replace(/(href=")\/|(src=")\//g, '$1$2');
      setPopupContent(content);
    }
    // Remove useless form
    const popupDocument = container.current?.ownerDocument;
    if (!popupDocument) return;
    const steamForm = popupDocument.querySelector('form:has(.extendium-popup)');
    if (steamForm) {
      changeTagPreserveChildren(steamForm, 'div');
    }
    const base = popupDocument.createElement('base');
    base.href = baseDir;
    popupDocument.head.prepend(base);

    if (queryParams !== undefined) {
      const url = new URL(popupWindow().location.href + queryParams);
      popupWindow().history.pushState({}, '', url);
    }

    initPopupContent();
  }, []);

  useEffect(() => {
    async function initPopup(): Promise<void> {
      if (popupContent === null) return;

      const popupDocument = container.current?.ownerDocument;
      if (!popupDocument?.defaultView) return;

      await injectHtml(popupContent, popupDocument.defaultView, extension, false, removeSteamCss, baseDir, popupContentUrl);

      // extension.contexts.addContext(popupDocument.defaultView, 'POPUP', extension.action.getPopupUrl() ?? '');

      resize();
      setTimeout(() => {
        resize();
      }, 100);
    }

    initPopup();
  }, [popupContent]);

  function resize(): void {
    const popupDocument = container.current?.ownerDocument;
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (!popupDocument || !popupDocument.defaultView) return;

    const size = getDesiredSize(centerPopup ? container.current : popupDocument.body, popupDocument);

    popupWindow().SteamClient.Window.ResizeTo(size.width, size.height, false);
    if (centerPopup) {
      popupWindow().SteamClient.Window.MoveTo(popupWindow().screen.availWidth / 2 - size.width / 2, popupWindow().screen.availHeight / 2 - size.height / 2, true);
    }
  }

  return (
    <>
      <base href={baseDir} />
      {/* eslint-disable-next-line react/no-danger */}
      <div ref={container} className="extendium-popup" dangerouslySetInnerHTML={{ __html: popupContent ?? '' }} />
    </>
  );
}

function getDesiredSize(element: HTMLElement, popupDocument: Document): { width: number; height: number; } {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.visibility = 'hidden';
  clone.style.position = 'absolute';
  clone.style.width = 'auto';
  clone.style.height = 'auto';
  clone.style.whiteSpace = 'nowrap'; // if text content
  popupDocument.body.appendChild(clone);

  const width = Math.min(clone.offsetWidth, mainWindow.innerWidth);
  const height = Math.min(clone.offsetHeight, mainWindow.innerHeight - 100);

  popupDocument.body.removeChild(clone);

  return { width, height };
}
