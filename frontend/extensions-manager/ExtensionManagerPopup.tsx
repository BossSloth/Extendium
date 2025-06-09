import { callable, DialogButton, ModalRoot, showModal } from '@steambrew/client';
import { DialogControlSectionClass, settingsClasses } from 'classes';
import { Styles } from 'components/Styles';
import React from 'react';
import { FaFolderOpen, FaSave, FaStore } from 'react-icons/fa';
import { mainWindow } from 'shared';
import { ExtensionManagerComponent } from './ExtensionManagerComponent';
import { showInstallExtensionModal } from './InstallExtensionModal';

const GetExtensionsDir = callable<[], string>('GetExtensionsDir');

export function ExtensionManagerPopup(): React.ReactNode {
  async function openExtensionsFolder(): Promise<void> {
    const extensionsDir = await GetExtensionsDir();
    SteamClient.System.OpenLocalDirectoryInSystemExplorer(extensionsDir);
  }

  return (
    <div className="extension-manager-popup">
      <Styles />
      <div className={`${DialogControlSectionClass}`}>
        <DialogButton className={`span-icon ${settingsClasses.SettingsDialogButton}`}>
          <FaSave />
          Save
        </DialogButton>
        <DialogButton
          onClick={showInstallExtensionModal}
          className={`span-icon ${settingsClasses.SettingsDialogButton}`}
        >
          <FaStore />
          Install extension
        </DialogButton>
        <DialogButton
          onClick={openExtensionsFolder}
          className={`span-icon ${settingsClasses.SettingsDialogButton}`}
        >
          <FaFolderOpen />
          Browse local files
        </DialogButton>
      </div>
      <div className="card-container">
        {[...extensions.values()].map(extension => (
          <ExtensionManagerComponent key={extension.getName()} extension={extension} />
        ))}
      </div>
    </div>
  );
}

export function OpenExtensionManagerPopup(): void {
  showModal(
    <ModalRoot>
      <ExtensionManagerPopup />
    </ModalRoot>,
    mainWindow,
    {
      popupHeight: mainWindow.innerHeight * 0.65,
      popupWidth: mainWindow.innerWidth * 0.75,
      bNeverPopOut: true,
      strTitle: 'Extensions',
    },
  );
}
