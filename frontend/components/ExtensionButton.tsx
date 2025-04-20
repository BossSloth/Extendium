import { showContextMenu } from '@steambrew/client';
import React, { JSX, useRef } from 'react';
import { Extension } from '../extension/Extension';
import { ContextMenu } from '../shared';
import { ExtensionPopup } from './ExtensionPopup';

export function ExtensionButton({ extension }: { readonly extension: Extension; }): JSX.Element {
  const contextMenuWindow = useRef<Window | null>(null);
  const contextMenuRef = useRef<ContextMenu | undefined>(undefined);

  function createContextMenu(targetElement: Element): void {
    if (contextMenuRef.current) return;

    contextMenuRef.current = (
      // @ts-expect-error wrong type
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      showContextMenu(
        <ExtensionPopup extension={extension} />,
        targetElement,
        // @ts-expect-error wrong type
        {
          bOverlapHorizontal: true,
          bGrowToElementWidth: true,
          bForcePopup: true,
          bDisableMouseOverlay: true,
          bCreateHidden: true,
          bRetainOnHide: true,
          bNoFocusWhenShown: undefined,
          title: `${extension.action.getTitle()} - Popup`,
        },
      ) as ContextMenu);
  }

  return (
    <button
      type="button"
      className="extension-button"
      onClick={() => {
        if (contextMenuRef.current) {
          contextMenuRef.current.Show();
        }
      }}
      title={extension.action.getTitle()}
      ref={(el) => {
        if (el) {
          contextMenuWindow.current = el.ownerDocument.defaultView;
          createContextMenu(el);
        }
      }}
    >
      <img src={extension.action.getIconUrl() ?? ''} alt={extension.manifest.name} />
    </button>
  );
}
