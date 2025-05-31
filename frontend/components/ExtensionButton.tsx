/* eslint-disable react/jsx-props-no-spreading */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { showContextMenu } from '@steambrew/client';
import React, { CSSProperties, JSX, useEffect, useRef, useState } from 'react';
import { Extension } from '../extension/Extension';
import { ContextMenu } from '../shared';
import { ExtensionPopup } from './ExtensionPopup';
// TODO: figure out how to keep the popup open but reload the content on open
const KEEP_OPEN = true;

export function ExtensionButton({ extension }: { readonly extension: Extension; }): JSX.Element {
  const [iconUrl, setIconUrl] = useState(extension.action.getIconUrl());
  const contextMenuWindow = useRef<Window | null>(null);
  const contextMenuRef = useRef<ContextMenu | undefined>(undefined);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging }
    = useSortable({ id: extension.manifest.name });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  useEffect(() => {
    // Listener to update icon when Action notifies
    function handleIconChange(): void {
      setIconUrl(extension.action.getIconUrl());
    }
    extension.action.subscribeToIconUrlChange(handleIconChange);

    // Cleanup
    return (): void => {
      extension.action.unsubscribeFromIconUrlChange(handleIconChange);
    };
  }, [extension]);

  useEffect(() => {
    return (): void => {
      contextMenuRef.current?.Close();
    };
  }, []);

  function createContextMenu(targetElement: Element | null | undefined): void {
    if (contextMenuRef.current || extension.action.getPopupUrl() === undefined) return;

    contextMenuRef.current = (
      // @ts-expect-error wrong type
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      showContextMenu(
        <ExtensionPopup extension={extension} popupContentUrl={extension.action.getPopupUrl() ?? ''} baseDir={extension.action.getPopupDir() ?? ''} />,
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

        if (extension.action.getPopupUrl() === undefined) {
          /** Only fire onClicked if there is no popup @see https://developer.chrome.com/docs/extensions/reference/api/action#event-onClicked */
          extension.action.onClicked.emit();
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
          setNodeRef(el);
        }
      }}
      style={style}
      {...attributes}
      {...listeners}
    >
      <img src={iconUrl ?? ''} alt={extension.manifest.name} />
    </button>
  );
}
