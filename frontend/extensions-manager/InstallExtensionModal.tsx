import { ConfirmModal, showModal, TextField } from '@steambrew/client';
import React from 'react';
import { mainWindow } from 'shared';
import { downloadExtensionFromUrl } from './Downloader/download-manager';

export function InstallExtensionModal({ closeModal }: { closeModal(): void; }): React.ReactNode {
  const [url, setUrl] = React.useState('');

  return (
    <ConfirmModal
      strTitle="Install extension"
      strDescription={(
        <>
          Enter an chrome extension URL to install it. For example: <br />
          <strong>https://chromewebstore.google.com/detail/steamdb/kdbmhfkmnlmbkgbabkdealhhbfhlmmon</strong>
          <TextField
            // @ts-expect-error placeholder is not a valid prop
            placeholder="Enter chrome web store URL"
            value={url}
            style={{ marginTop: '2rem' }}
            onChange={(e) => { setUrl(e.target.value); }}
          />
        </>
      )}
      bHideCloseIcon
      onOK={() => {
        downloadExtensionFromUrl(url);
        closeModal();
      }}
      onCancel={() => {
        closeModal();
      }}
      strOKButtonText="Install"
    />
  );
}

export function showInstallExtensionModal(): void {
  const modal = showModal(
    <InstallExtensionModal closeModal={() => { modal.Close(); }} />,
    mainWindow,
    {
      // popupHeight: mainWindow.innerHeight / 2,
      // popupWidth: mainWindow.innerWidth / 2,
      bNeverPopOut: true,
      strTitle: 'Install extension',
    },
  );
}
