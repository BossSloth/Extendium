import { ConfirmModal, showModal, ShowModalResult } from '@steambrew/client';
import { DeleteLegacyExtensions } from 'callables';
import { OpenTargetPage } from 'chrome/ChromePageManager';
import { showConfirmationModal } from 'components/ConfirmationModal';
import React from 'react';
import { mainWindow } from 'shared';
import { t } from './i18n';

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
        {t('legacyDesc')}
        <br />
        {t('legacyReinstall')}
        <br />
        {t('legacyDeleteInstruction')}
      </p>
      <div style={{ marginTop: '10px', marginBottom: '10px', maxHeight: '300px', overflowY: 'auto' }}>
        {extensions.map(ext => (
          <div key={ext.name} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold' }}>{ext.name}</div>
            {ext.hasMetadata && ext.url !== undefined
              ? (
                  <a href={ext.url} onClick={openInSteam} style={{ fontSize: '12px', color: '#66c0f4' }}>
                    {t('openInWebStore')}
                  </a>
                )
              : (
                  <div style={{ fontSize: '12px', color: '#8f98a0' }}>{t('manuallyInstalled')}</div>
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
      title: t('deleteConfirmTitle'),
      description: t('deleteConfirmDesc'),
      okButtonText: t('deleteAllBtn'),
      onOK: async () => {
        await DeleteLegacyExtensions();
        showConfirmationModal({
          title: t('deletedTitle'),
          description: t('deletedDesc'),
          okButtonText: t('okBtn'),
        });
      },
      bDestructiveWarning: true,
    });
  }

  dialog = showModal(
    <ConfirmModal
      strTitle={t('legacyTitle')}
      strDescription={<LegacyExtensionDialogDescription extensions={extensions} />}
      strOKButtonText={hasAnyWebstoreExtensions ? t('openAllInWebStore') : t('okBtn')}
      strMiddleButtonText={t('deleteAllBtn')}
      strCancelButtonText={hasAnyWebstoreExtensions ? t('closeBtn') : undefined}
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
