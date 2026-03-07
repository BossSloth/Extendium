/* eslint-disable react/no-unescaped-entities */
import { ConfirmModal, showModal } from '@steambrew/client';
import { InstallInternalExtension } from 'callables';
import React from 'react';
import { mainWindow } from 'shared';

function openInExternalBrowser(event: React.MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  const href = event.currentTarget.href;
  SteamClient.System.OpenInSystemBrowser(href);
}

export function showExtensionInstallationFailedDialog(): void {
  const dialog = showModal(
    <ConfirmModal
      strTitle="Extendium installation failed"
      strDescription={(
        <>
          <p>
            Extendium needs a helper extension to work properly, but the automatic installation didn't complete successfully.
          </p>
          <p>
            You can try the automatic installation again, or manually install the helper extension
            by following the step-by-step instructions in the readme <a href="https://github.com/BossSloth/extendium/blob/main/README.md#helper-extension" onClick={openInExternalBrowser}>here</a>.
            {/* TODO: create this section in the readme */}
          </p>
          <p>
            If the problem persists, please check the plugin logs for more details and report this issue
            on the <a href="https://github.com/BossSloth/extendium" onClick={openInExternalBrowser}>Extendium GitHub repository</a> or the <a href="https://discord.com/channels/1102739071085846623/1380854735183282309" onClick={openInExternalBrowser}>discord channel</a> with your log.
          </p>
        </>
      )}
      strOKButtonText="Try installation again"
      strCancelButtonText="Understood, I will manually install it"
      bDisableBackgroundDismiss
      bHideCloseIcon
      strMiddleButtonText="Show logs"
      onOK={async () => {
        await InstallInternalExtension();
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
