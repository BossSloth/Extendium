import { Extension } from '@extension/Extension';
import { Menu, MenuItem, showContextMenu } from '@steambrew/client';
import { openExtensionManagerPopup } from 'extensions-manager/ExtensionManagerPopup';
import React, { JSX } from 'react';
import { createOptionsWindow } from '../../windowManagement';
import { Separator } from '../Separator';
import { useExtensionsBarStore } from '../stores/extensionsBarStore';

export function ExtensionContextMenu({ extension }: { readonly extension: Extension; }): JSX.Element {
  const { setExtensionsOrder } = useExtensionsBarStore();

  function openHomepage(): void {
    if (extension.manifest.homepage_url !== undefined) {
      SteamClient.System.OpenInSystemBrowser(extension.manifest.homepage_url);
    }
  }

  function unpin(): void {
    setExtensionsOrder((order) => {
      return order.filter(id => id !== extension.getName());
    });
  }

  return (
    <div className="extension-context-menu">
      <Menu label={extension.getName()}>
        <MenuItem onClick={openHomepage}>
          {extension.getName()}
        </MenuItem>
        <Separator />
        {extension.options.hasOptions() && <MenuItem onClick={() => { createOptionsWindow(extension); }}>Options</MenuItem>}
        <MenuItem onClick={unpin}>Unpin</MenuItem>
        <Separator />
        <MenuItem onClick={() => { openExtensionManagerPopup(`info/${extension.getName()}`); }}>Manage</MenuItem>
      </Menu>
    </div>
  );
}

export function showExtensionContextMenu(extension: Extension, targetElement: Element): void {
  showContextMenu(
    <ExtensionContextMenu extension={extension} />,
    targetElement,
    {
      bOverlapHorizontal: true,
      bGrowToElementWidth: true,
      bForcePopup: true,
      bDisableMouseOverlay: true,
      bCreateHidden: false,
      bRetainOnHide: false,
      bNoFocusWhenShown: undefined,
      title: `${extension.action.getTitle()} - Context Menu`,
    },
  );
}
