import { DialogHeader, Field } from '@steambrew/client';
import { openExtensionManagerPopup } from 'extensions-manager/ExtensionManagerPopup';
import React from 'react';
import { FaCog } from 'react-icons/fa';
import { useExtensionsBarStore } from '../stores/extensionsBarStore';
import { ManagerExtensionItem } from './ManagerExtensionItem';

export function ToolbarManagerContextMenu(): React.JSX.Element {
  const { extensionsOrder, setExtensionsOrder } = useExtensionsBarStore();

  function isExtensionPinned(extensionId: string): boolean {
    return extensionsOrder.includes(extensionId);
  }

  function pinExtension(extensionId: string): void {
    setExtensionsOrder((order) => {
      return [...order, extensionId];
    });
  }

  function unpinExtension(extensionId: string): void {
    setExtensionsOrder((order) => {
      return order.filter(id => id !== extensionId);
    });
  }

  return (
    <div style={{ padding: '1rem', width: '18rem' }}>
      <DialogHeader>Extensions</DialogHeader>
      {[...extensions.values()].map(extension => (
        <ManagerExtensionItem
          key={extension.getName()}
          extension={extension}
          pinned={isExtensionPinned(extension.getName())}
          pinExtension={pinExtension}
          unpinExtension={unpinExtension}
        />
      ))}
      <Field icon={<FaCog />} label="Manage extensions" onClick={() => { openExtensionManagerPopup(); }} />
    </div>
  );
}
