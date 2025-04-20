import React, { JSX, useEffect, useRef, useState } from 'react';
import { injectBrowser } from '../Browser';
import { Extension } from '../extension/Extension';
import { loadScript } from '../shared';

export function ExtensionPopup({ extension }: { readonly extension: Extension; }): JSX.Element {
  const [popupContent, setPopupContent] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initPopupContent(): Promise<void> {
      const content = await fetch(extension.action.getPopupUrl() ?? '').then(async r => r.text());
      // content = content.replace(/(href=")\/|(src=")\//g, '$1$2');
      setPopupContent(content);
    }
    initPopupContent();
  }, []);

  useEffect(() => {
    async function initPopup(): Promise<void> {
      if (popupContent === null) return;

      const popupDocument = container.current?.ownerDocument;
      if (!popupDocument || !popupDocument.defaultView) return;

      const domParser = new DOMParser();
      const doc = domParser.parseFromString(popupContent, 'text/html');

      await injectBrowser('content', popupDocument.defaultView, extension);
      const popupWindow = popupDocument.defaultView;

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

      popupDocument.dispatchEvent(new Event('DOMContentLoaded', {
        bubbles: true,
        cancelable: true,
      }));

      popupWindow.dispatchEvent(new Event('load', {
        bubbles: true,
        cancelable: true,
      }));
    }

    initPopup();
  }, [popupContent]);

  return (
    <>
      <base href={`${extension.url}/`} />
      {/* eslint-disable-next-line react/no-danger */}
      <div ref={container} dangerouslySetInnerHTML={{ __html: popupContent ?? '' }} />
    </>
  );
}
