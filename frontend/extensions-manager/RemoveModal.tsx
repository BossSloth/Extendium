import { Extension } from '@extension/Extension';
import { callable } from '@steambrew/client';
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
      await RemoveExtension({ name: extension.folderName });
      showRestartModal();
    },
    bNeverPopOut: true,
  });
}
