/* eslint-disable react/no-multi-comp */
import { ConfirmModal, showModal, ShowModalResult, Spinner, TextField } from '@steambrew/client';
import React, { useEffect } from 'react';
import { mainWindow } from 'shared';
import { downloadExtensionFromUrl } from './Downloader/download-manager';

export function InstallExtensionModal({ modal }: { readonly modal: ShowModalResult | null; }): React.ReactNode {
  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);

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
      onOK={async () => {
        setLoading(true);
        await downloadExtensionFromUrl(url);
        setLoading(false);
        modal?.Close();
      }}
      onCancel={() => {
        modal?.Close();
      }}
      strOKButtonText={loading ? <><Spinner style={{ marginRight: '5px', marginBottom: '-6px' }} />Installing...</> : 'Install'}
    />
  );
}

export function showInstallExtensionModal(): void {
  let modal: ShowModalResult | null = null;

  function WrappedModal(): React.ReactNode {
    const [modalInstance, setModalInstance] = React.useState<ShowModalResult | null>(null);

    useEffect(() => {
      setModalInstance(modal);
    }, []);

    return <InstallExtensionModal modal={modalInstance} />;
  }

  modal = showModal(
    <WrappedModal />,
    mainWindow,
    {
      // popupHeight: mainWindow.innerHeight / 2,
      // popupWidth: mainWindow.innerWidth / 2,
      bNeverPopOut: true,
      strTitle: 'Install extension',
    },
  );
}
