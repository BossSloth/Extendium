import { DialogHeader } from '@steambrew/client';
import React from 'react';
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
    <div style={{ padding: '1rem' }}>
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
    </div>
  );
}
