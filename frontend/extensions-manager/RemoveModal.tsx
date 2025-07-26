import { Extension } from '@extension/Extension';
import { callable } from '@steambrew/client';
import { useExtensionsBarStore } from 'components/stores/extensionsBarStore';
import React from 'react';
import { showConfirmationModal } from '../components/ConfirmationModal';
import { showRestartModal } from './RestartModal';

const RemoveExtension = callable<[{ name: string; }], void>('RemoveExtension');

export function showRemoveModal(extension: Extension): void {
  showConfirmationModal({
    title: 'Remove extension',
    description: (
      <p>Are you sure you want to remove {extension.getName()}?</p>
    ),
    okButtonText: 'Remove',
    onOK: async () => {
      await removeExtension(extension);
      showRestartModal();
    },
    bNeverPopOut: true,
  });
}

async function removeExtension(extension: Extension): Promise<void> {
  await RemoveExtension({ name: extension.folderName });
  const order = useExtensionsBarStore.getState().extensionsOrder;
  if (order.includes(extension.folderName)) {
    order.splice(order.indexOf(extension.folderName), 1);
    useExtensionsBarStore.setState({ extensionsOrder: order });
  }
}
