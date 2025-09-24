import { showContextMenu } from '@steambrew/client';
import React from 'react';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { useUpdateStore } from 'updates/updateStore';
import { ToolbarManagerContextMenu } from './ToolbarManagerContextMenu';

export function ToolbarManagerButton(): React.JSX.Element {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const hasAnyUpdate = useUpdateStore(state => state.updateAvailable.length > 0);

  function openExtensionsContextMenu(): void {
    if (!buttonRef.current) return;

    showContextMenu(
      <ToolbarManagerContextMenu />,
      buttonRef.current,
      {
        bOverlapHorizontal: true,
        bGrowToElementWidth: true,
        bForcePopup: true,
        bDisableMouseOverlay: true,
        bCreateHidden: false,
        bRetainOnHide: false,
        bNoFocusWhenShown: undefined,
        title: 'Extensions',
      },
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="extension-button"
      onClick={openExtensionsContextMenu}
      title={hasAnyUpdate ? 'Extensions - updates available' : 'Extensions'}
    >
      <IoExtensionPuzzleOutline color="gray" size={17} style={{ padding: 0 }} />
      {hasAnyUpdate && <span className="update-dot" aria-label="Updates available" />}
    </button>
  );
}
