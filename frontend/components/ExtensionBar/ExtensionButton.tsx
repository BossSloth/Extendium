/* eslint-disable react/jsx-props-no-spreading */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Extension } from '@extension/Extension';
import { showContextMenu } from '@steambrew/client';
import React, { CSSProperties, JSX, MouseEvent, useEffect, useRef, useState } from 'react';
import { ContextMenu } from '../../shared';
import { ExtensionPopup } from '../ExtensionPopup';
import { showExtensionContextMenu } from './ExtensionContextMenu';
// TODO: figure out how to keep the popup open but reload the content on open
const KEEP_OPEN = false;

export function ExtensionButton({ extension }: { readonly extension: Extension; }): JSX.Element {
  const [iconUrl, setIconUrl] = useState(extension.action.getIconUrl());
  const contextMenuWindow = useRef<Window | null>(null);
  const popupContextMenuRef = useRef<ContextMenu | undefined>(undefined);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging }
    = useSortable({ id: extension.manifest.name });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  // Listener to update icon when Action notifies
  useEffect(() => {
    function handleIconChange(): void {
      setIconUrl(extension.action.getIconUrl());
    }
    extension.action.subscribeToIconUrlChange(handleIconChange);

    // Cleanup to unsubscribe from icon change
    return (): void => {
      extension.action.unsubscribeFromIconUrlChange(handleIconChange);
    };
  }, [extension]);

  // Cleanup to close context menu on unmount
  useEffect(() => {
    return (): void => {
      popupContextMenuRef.current?.Close?.();
    };
  }, []);

  function createPopupContextMenu(targetElement: Element | null | undefined, clickEvent?: MouseEvent): void {
    if (popupContextMenuRef.current || extension.action.getPopupUrl() === undefined) return;

    // Debug feature to keep the popup open to view the logs/content
    const keepOpen = clickEvent !== undefined && clickEvent.ctrlKey && clickEvent.altKey;

    popupContextMenuRef.current = (
      showContextMenu(
        <ExtensionPopup extension={extension} popupContentUrl={extension.action.getPopupUrl() ?? ''} baseDir={extension.action.getPopupDir() ?? ''} />,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        targetElement!,
        {
          bOverlapHorizontal: true,
          bGrowToElementWidth: true,
          bForcePopup: true,
          bDisableMouseOverlay: true,
          bCreateHidden: false,
          bRetainOnHide: keepOpen,
          bNoFocusWhenShown: undefined,
          title: `${extension.action.getTitle()} - Popup`,
        },
      ) as ContextMenu);
  }

  function onClick(clickEvent: MouseEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (KEEP_OPEN) {
      if (popupContextMenuRef.current) {
        popupContextMenuRef.current.Show();
      }
    } else {
      popupContextMenuRef.current = undefined;
      createPopupContextMenu(contextMenuWindow.current?.document.activeElement, clickEvent);
    }

    if (extension.action.getPopupUrl() === undefined) {
      /** Only fire onClicked if there is no popup @see https://developer.chrome.com/docs/extensions/reference/api/action#event-onClicked */
      extension.action.onClicked.emit();
    }
  }

  function onContextMenu(): void {
    if (!contextMenuWindow.current) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    showExtensionContextMenu(extension, contextMenuWindow.current.document.activeElement!);
  }

  return (
    <button
      type="button"
      className="extension-button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={extension.action.getTitle()}
      ref={(el) => {
        if (el) {
          contextMenuWindow.current = el.ownerDocument.defaultView;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (KEEP_OPEN) {
            createPopupContextMenu(el);
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
