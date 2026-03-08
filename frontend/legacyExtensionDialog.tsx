import { ConfirmModal, showModal, ShowModalResult } from '@steambrew/client';
import { DeleteLegacyExtensions } from 'callables';
import { OpenTargetPage } from 'chrome/ChromePageManager';
import { showConfirmationModal } from 'components/ConfirmationModal';
import React from 'react';
import { mainWindow } from 'shared';

export interface LegacyExtension {
  extensionId?: string;
  hasMetadata: boolean;
  name: string;
  url?: string;
}

function openInSteam(event: React.MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  const href = event.currentTarget.href;
  OpenTargetPage(href);
}

function LegacyExtensionDialogDescription({ extensions }: { readonly extensions: LegacyExtension[]; }): React.ReactNode {
  return (
    <>
      <p>
        The following extensions were found in Extendium's .extensions folder. These were previously installed using Extendium's old installation method and will no longer work.
        <br />
        Please reinstall them from the Chrome Web Store to ensure they function correctly.
        <br />
        To not show this dialog again use the "Delete All" button below to delete all legacy extensions.
      </p>
      <div style={{ marginTop: '10px', marginBottom: '10px', maxHeight: '300px', overflowY: 'auto' }}>
        {extensions.map(ext => (
          <div key={ext.name} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold' }}>{ext.name}</div>
            {ext.hasMetadata && ext.url !== undefined
              ? (
                  <a href={ext.url} onClick={openInSteam} style={{ fontSize: '12px', color: '#66c0f4' }}>
                    Open in Chrome Web Store
                  </a>
                )
              : (
                  <div style={{ fontSize: '12px', color: '#8f98a0' }}>Manually installed (no web store link)</div>
                )}
          </div>
        ))}
      </div>
    </>
  );
}

export function showLegacyExtensionDialog(extensionsJson: string): void {
  const extensions = JSON.parse(extensionsJson) as LegacyExtension[];

  if (extensions.length === 0) {
    return;
  }

  const extensionsWithUrls = extensions.filter(ext => ext.hasMetadata && ext.url !== undefined);
  const hasAnyWebstoreExtensions = extensionsWithUrls.length > 0;

  // eslint-disable-next-line prefer-const
  let dialog: ShowModalResult;

  function handleDeleteAll(): void {
    dialog.Close();
    showConfirmationModal({
      title: 'Delete All Legacy Extensions?',
      description: 'Are you sure you want to delete all legacy extension folders? This action cannot be undone.',
      okButtonText: 'Delete All',
      onOK: async () => {
        await DeleteLegacyExtensions();
        showConfirmationModal({
          title: 'Legacy Extensions Deleted',
          description: 'All legacy extension folders have been deleted.',
          okButtonText: 'OK',
        });
      },
      bDestructiveWarning: true,
    });
  }

  dialog = showModal(
    <ConfirmModal
      strTitle="Legacy Extendium Extensions Detected"
      strDescription={<LegacyExtensionDialogDescription extensions={extensions} />}
      strOKButtonText={hasAnyWebstoreExtensions ? 'Open All in Web Store' : 'OK'}
      strMiddleButtonText="Delete All"
      strCancelButtonText={hasAnyWebstoreExtensions ? 'Close' : undefined}
      bDisableBackgroundDismiss
      onOK={() => {
        if (hasAnyWebstoreExtensions) {
          extensionsWithUrls.forEach((ext) => {
            if (ext.url !== undefined && ext.url !== '') {
              OpenTargetPage(ext.url);
            }
          });
        }
      }}
      onMiddleButton={handleDeleteAll}
      onCancel={() => { dialog.Close(); }}
    />,
    mainWindow,
    {
      popupWidth: 735,
      popupHeight: 600,
    },
  );
}
