import React, { JSX, useEffect, useRef, useState } from 'react';
import { Extension } from '../extension/Extension';
import { injectHtml } from '../windowManagement';

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

      await injectHtml(popupContent, popupDocument.defaultView, extension, false);

      extension.contexts.addContext(popupDocument.defaultView, 'POPUP', extension.action.getPopupUrl() ?? '');
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
