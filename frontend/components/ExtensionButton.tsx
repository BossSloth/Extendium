import { showContextMenu } from '@steambrew/client';
import React, { JSX, useRef } from 'react';
import { Extension } from '../extension/Extension';
import { ContextMenu } from '../shared';
import { ExtensionPopup } from './ExtensionPopup';

const KEEP_OPEN = false;

export function ExtensionButton({ extension }: { readonly extension: Extension; }): JSX.Element {
  const contextMenuWindow = useRef<Window | null>(null);
  const contextMenuRef = useRef<ContextMenu | undefined>(undefined);

  function createContextMenu(targetElement: Element | null | undefined): void {
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
          bCreateHidden: KEEP_OPEN,
          bRetainOnHide: KEEP_OPEN,
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
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (KEEP_OPEN) {
          if (contextMenuRef.current) {
            contextMenuRef.current.Show();
          }
        } else {
          contextMenuRef.current = undefined;
          createContextMenu(contextMenuWindow.current?.document.activeElement);
        }
      }}
      title={extension.action.getTitle()}
      ref={(el) => {
        if (el) {
          contextMenuWindow.current = el.ownerDocument.defaultView;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (KEEP_OPEN) {
            createContextMenu(el);
          }
        }
      }}
    >
      <img src={extension.action.getIconUrl() ?? ''} alt={extension.manifest.name} />
    </button>
  );
}
