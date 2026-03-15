import { Extension } from '@extension/Extension';
import { ConfirmModal, showModal } from '@steambrew/client';
import { getExtensionManifest, getExtensions, persistentExtensionsPage, uninstallExtension } from 'chrome/ChromeExtensionPageManager';
import { ExtensionInfo } from 'chrome/types';
import { BROKEN_EXTENSION_IDS, INTERNAL_HOME_PAGE_URL } from 'constant';
import React from 'react';
import { mainWindow } from 'shared';
import { useExtensionsStore } from 'stores/extensionsStore';

export async function initializeExtension(): Promise<void> {
  const { setExtension, removeExtension } = useExtensionsStore.getState();

  persistentExtensionsPage.on('INSTALLED', async (_, extensionInfo) => {
    if (extensionInfo === undefined) {
      return;
    }

    if (extensionInfo.manifestHomePageUrl === INTERNAL_HOME_PAGE_URL) {
      // Don't show our internal extensions
      return;
    }

    if (BROKEN_EXTENSION_IDS.includes(extensionInfo.id)) {
      showBrokenExtensionWarning(extensionInfo.id, extensionInfo.name);

      return;
    }

    setExtension(new Extension(await getExtensionManifest(extensionInfo.id), extensionInfo));
  });
  persistentExtensionsPage.on('UNINSTALLED', (extensionId) => {
    removeExtension(extensionId);
  });

  function updateExistingExtension(extensionId: string, extensionInfo: ExtensionInfo | undefined): void {
    const existingExtension = useExtensionsStore.getState().extensions.get(extensionId);
    if (existingExtension === undefined || extensionInfo === undefined) {
      return;
    }
    setExtension(new Extension(existingExtension.manifest, extensionInfo));
  }
  persistentExtensionsPage.on('LOADED', updateExistingExtension);
  persistentExtensionsPage.on('UNLOADED', updateExistingExtension);
  await persistentExtensionsPage.initialize();

  await getExtensions().then((exts) => {
    exts.forEach(async (ext) => {
      if (ext.manifestHomePageUrl === INTERNAL_HOME_PAGE_URL) {
        // Don't show our internal extensions
        return;
      }

      setExtension(new Extension(await getExtensionManifest(ext.id), ext));
    });
  });
}

function showBrokenExtensionWarning(extensionId: string, extensionName: string): void {
  const dialog = showModal(
    <ConfirmModal
      strTitle="Unsupported extension installed"
      bAlertDialog
      bDisableBackgroundDismiss
      bHideCloseIcon
      strDescription={(
        <>
          <p>
            We've automatically detected an extension ({extensionName}:{extensionId}) that is known to cause Steam to become unresponsive, crash or become fully bricked.
          </p>
          <strong>
            You WILL NEED to remove this extension to prevent potential issues with your Steam client.
            <br />
            You can find more information about compatible extensions on the Extendium github page.
          </strong>
        </>
      )}
      strOKButtonText="Uninstall extension"
      onOK={() => {
        uninstallExtension(extensionId).then(() => {
          dialog.Close();
        }).catch(() => {
          showBrokenExtensionWarning(extensionId, extensionName);
        });
      }}
      onCancel={() => {
        showBrokenExtensionWarning(extensionId, extensionName);
      }}
    />,
    mainWindow,
    {
      popupWidth: 635,
      popupHeight: 475,
    },
  );
}
