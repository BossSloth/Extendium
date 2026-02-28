import { DialogHeader, Field } from '@steambrew/client';
import { openExtensionManagerPopup } from 'extensions-manager/ExtensionManagerPopup';
import React, { useMemo } from 'react';
import { FaCog } from 'react-icons/fa';
import { useExtensionsStore } from 'stores/extensionsStore';
import { useExtensionsBarStore } from '../stores/extensionsBarStore';
import { ManagerExtensionItem } from './ManagerExtensionItem';

export function ToolbarManagerContextMenu(): React.JSX.Element {
  const { extensionsOrder, setExtensionsOrder } = useExtensionsBarStore();
  const { extensions: allExtensions } = useExtensionsStore();

  const enabledExtensions = useMemo(() => {
    return Array.from(allExtensions.values()).filter(extension => extension.enabled);
  }, [allExtensions]);

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
      {enabledExtensions
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(extension => (
          <ManagerExtensionItem
            key={extension.id}
            extension={extension}
            pinned={isExtensionPinned(extension.id)}
            pinExtension={pinExtension}
            unpinExtension={unpinExtension}
          />
        ))}
      <Field icon={<FaCog />} label="Manage extensions" onClick={() => { openExtensionManagerPopup(); }} />
    </div>
  );
}
