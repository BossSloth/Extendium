/* eslint-disable react/jsx-props-no-spreading */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Extension } from '@extension/Extension';
import { showContextMenu } from '@steambrew/client';
import { RuntimeEvaluate } from 'chrome/ChromePageManager';
import { BrowserView } from 'components/BrowserView';
import { ExtensionAction } from 'components/ExtensionAction';
import { overrideContextMenuCancel } from 'contextMenuOveride';
import React, { CSSProperties, JSX, MouseEvent, useEffect, useRef } from 'react';
import { ContextMenu } from '../../shared';
import { showExtensionContextMenu } from './ExtensionContextMenu';
// TODO: figure out how to keep the popup open but reload the content on open
const KEEP_OPEN = false;

export interface Size {
  readonly height: number;
  readonly width: number;
}

export function ExtensionButton({ extension }: { readonly extension: Extension; }): JSX.Element {
  const contextMenuWindow = useRef<Window | null>(null);
  const popupContextMenuRef = useRef<ContextMenu | undefined>(undefined);
  const focusHasBeenSetRef = useRef<boolean>(false);
  const resizeCallbackRef = useRef<((size: Size) => void) | undefined>(undefined);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging }
    = useSortable({ id: extension.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  // Cleanup to close context menu on unmount
  useEffect(() => {
    return (): void => {
      popupContextMenuRef.current?.Hide();
      popupContextMenuRef.current?.Close?.();
    };
  }, []);

  function handleFocusChanged(focused: boolean): void {
    if (!focused) {
      popupContextMenuRef.current?.Hide();
      popupContextMenuRef.current = undefined;
      focusHasBeenSetRef.current = false;

      return;
    }
    focusHasBeenSetRef.current = true;
  }

  async function onBrowserViewCreated(sessionId: string): Promise<void> {
    const newSize = await RuntimeEvaluate(sessionId, async (): Promise<Size> => {
      function getSize(): Size {
        const allElemPos = [];
        for (const elem of document.body.children) {
          if (!elem.checkVisibility()) continue;
          const rect = elem.getBoundingClientRect();
          allElemPos.push({ top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, outerHTML: elem.outerHTML });
        }
        let minTop = -1;
        let minLeft = -1;
        let maxRight = 0;
        let maxBottom = 0;
        for (const rect of allElemPos) {
          if (minLeft === -1 || rect.left < minLeft) minLeft = rect.left;
          if (minTop === -1 || rect.top < minTop) minTop = rect.top;
          if (rect.right > maxRight) maxRight = rect.right;
          if (rect.bottom > maxBottom) maxBottom = rect.bottom;
        }

        return { width: Math.ceil(maxRight - minLeft), height: Math.ceil(maxBottom - minTop) };
      }

      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(getSize());
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            resolve(getSize());
          }, { once: true });
        }
      });
    });

    console.log('Calculated size:', newSize);
    resizeCallbackRef.current?.(newSize);
  }

  function onBrowserViewClosed(): void {
    if (popupContextMenuRef.current) {
      popupContextMenuRef.current.Hide();
      popupContextMenuRef.current.Close?.();
    }
  }

  function createPopupContextMenu(targetElement: Element | null | undefined, clickEvent?: MouseEvent): void {
    if (popupContextMenuRef.current || extension.action.popupUrl === undefined) return;

    // Reset focus tracking for new context menu
    focusHasBeenSetRef.current = false;

    // Debug feature to keep the popup open to view the logs/content
    const keepOpen = clickEvent !== undefined && clickEvent.ctrlKey && clickEvent.altKey;
    const title = `${extension.name} - Popup`;

    popupContextMenuRef.current = (
      showContextMenu(
        <ExtensionAction onResizeCallback={(callback: (size: Size) => void) => { resizeCallbackRef.current = callback; }}>
          <BrowserView
            expectedParentPopupTitle={title}
            url={extension.action.popupUrl}
            onFocusChanged={handleFocusChanged}
            onCreated={onBrowserViewCreated}
            onClosed={onBrowserViewClosed}
          />
        </ExtensionAction>,
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
          title,
          // @ts-expect-error extra prop added by patch
          shouldAllowBlurClose: () => !focusHasBeenSetRef.current,
        },
      ) as ContextMenu);
    overrideContextMenuCancel(popupContextMenuRef.current);
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

    if (extension.action.popupUrl === undefined) {
      /** Only fire onClicked if there is no popup @see https://developer.chrome.com/docs/extensions/reference/api/action#event-onClicked */
      // extension.action.onClicked.emit();
      // TODO: fire onClicked event

      // Open context menu if no action popup is defined
      onContextMenu();
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
      title={extension.name}
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
      <img src={extension.action.iconUrl} alt={extension.name} />
    </button>
  );
}
