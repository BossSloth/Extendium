import { Extension } from '@extension/Extension';
import { Menu, MenuItem } from '@steambrew/client';
import React, { JSX } from 'react';
import { createOptionsWindow } from '../../windowManagement';
import { Separator } from '../Separator';
import { useExtensionsBarStore } from '../stores/extensionsBarStore';

export function ExtensionContextMenu({ extension }: { readonly extension: Extension; }): JSX.Element {
  const { setExtensionsOrder } = useExtensionsBarStore();

  const hasOptions = extension.manifest.options_ui?.page !== undefined;

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
        {hasOptions && <MenuItem onClick={() => { createOptionsWindow(extension); }}>Options</MenuItem>}
        <MenuItem onClick={unpin}>Unpin</MenuItem>
        <Separator />
        <MenuItem>Manage</MenuItem>
      </Menu>
    </div>
  );
}
