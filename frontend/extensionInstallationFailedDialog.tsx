import { ConfirmModal, showModal } from '@steambrew/client';
import { IgnoreInternalExtensionRequirement, InstallInternalExtension } from 'callables';
import React from 'react';
import { mainWindow } from 'shared';
import { t } from './i18n';

function openInExternalBrowser(event: React.MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  const href = event.currentTarget.href;
  SteamClient.System.OpenInSystemBrowser(href);
}

export function showExtensionInstallationFailedDialog(): void {
  const readmeParts = t('failedDesc3').split('{readmeLink}');
  const githubParts = t('failedDesc4').split('{githubLink}');
  const firstPart = githubParts[0];
  const rest = githubParts[1] ?? '';
  const discordParts = rest.split('{discordLink}');

  const dialog = showModal(
    <ConfirmModal
      strTitle={t('failedTitle')}
      strDescription={(
        <>
          <p>
            {t('failedDesc1')}
          </p>
          <p>
            {t('failedDesc2')}
          </p>
          <p>
            {readmeParts[0]}
            <a href="https://github.com/BossSloth/extendium/blob/main/README.md#helper-extension" onClick={openInExternalBrowser}>
              {t('here')}
            </a>
            {readmeParts[1]}
          </p>
          <p>
            {firstPart}
            <a href="https://github.com/BossSloth/extendium" onClick={openInExternalBrowser}>
              {t('githubRepo')}
            </a>
            {discordParts[0]}
            <a href="https://discord.com/channels/1102739071085846623/1380854735183282309" onClick={openInExternalBrowser}>
              {t('discordChannel')}
            </a>
            {discordParts[1]}
          </p>
        </>
      )}
      strOKButtonText={t('tryAgain')}
      strMiddleButtonText={t('ignoreBtn')}
      strCancelButtonText={t('understoodBtn')}
      bDisableBackgroundDismiss
      bHideCloseIcon
      onOK={async () => {
        await InstallInternalExtension();
        dialog.Close();
      }}
      onMiddleButton={async () => {
        await IgnoreInternalExtensionRequirement();
        dialog.Close();
      }}
      onCancel={() => { dialog.Close(); }}
    />,
    mainWindow,
    {
      popupWidth: 635,
      popupHeight: 475,
    },
  );
}
